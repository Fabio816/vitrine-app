// services/googleDrive.js
class GoogleDriveService {
  constructor() {
    this.CLIENT_ID = process.env.VUE_APP_GOOGLE_CLIENT_ID;
    this.CLIENT_SECRET = process.env.VUE_APP_GOOGLE_CLIENT_SECRET;
     this.REDIRECT_URI = window.location.origin + window.location.pathname;
    this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
    this.accessToken = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('✅ Google Drive já inicializado');
      return;
    }

    console.log('🔄 Inicializando Google Drive...');
    
    try {
      // Verificar se estamos retornando de um OAuth
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        console.log('📨 Detectado retorno do OAuth, processando...');
        await this.handleAuthReturn(code, state);
        
        // Limpar URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // Verificar token salvo
      const savedToken = localStorage.getItem('google_drive_token');
      const tokenExpiry = localStorage.getItem('google_drive_token_expiry');
      
      if (savedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        this.accessToken = savedToken;
        console.log('✅ Token restaurado do localStorage');
      }
      
      this.isInitialized = true;
      console.log('✅ Google Drive inicializado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro na inicialização:', error);
      this.isInitialized = true; // Continua mesmo com erro
    }
  }

  async authenticate() {
    console.log('🔐 Iniciando autenticação OAuth...');
    
    // Salvar estado atual para retorno
    const state = Math.random().toString(36).substring(2);
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_return_path', window.location.href);

    const authParams = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: this.SCOPES,
      access_type: 'offline',
      state: state,
      prompt: 'consent'
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${authParams.toString()}`;
    
    console.log('🔄 Redirecionando para autenticação...');
    window.location.href = authUrl;
    
    // Não retornamos nada pois a página será redirecionada
    return new Promise(() => {}); // Promise que nunca resolve
  }

  async handleAuthReturn(code, state) {
    try {
      console.log('📨 Processando retorno da autenticação...');
      
      // Verificar estado
      const savedState = localStorage.getItem('oauth_state');
      if (state !== savedState) {
        throw new Error('Falha na verificação de segurança');
      }

      // Trocar código por token
      console.log('🔄 Obtendo token de acesso...');
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.CLIENT_ID,
          client_secret: this.CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error_description || errorData.error);
      }

      const tokenData = await tokenResponse.json();
      this.accessToken = tokenData.access_token;
      
      const expiryTime = Date.now() + (tokenData.expires_in * 1000);
      localStorage.setItem('google_drive_token', this.accessToken);
      localStorage.setItem('google_drive_token_expiry', expiryTime.toString());
      
      if (tokenData.refresh_token) {
        localStorage.setItem('google_drive_refresh_token', tokenData.refresh_token);
      }

      console.log('✅ Autenticação concluída com sucesso');
      
      // Limpar estado
      localStorage.removeItem('oauth_state');
      
      // Retornar para a página original
      const returnPath = localStorage.getItem('oauth_return_path');
      if (returnPath && !returnPath.includes('code=')) {
        localStorage.removeItem('oauth_return_path');
        window.location.href = returnPath;
      }
      
      return tokenData;
      
    } catch (error) {
      console.error('❌ Erro no retorno da autenticação:', error);
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_return_path');
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('google_drive_refresh_token');
    
    if (!refreshToken) {
      throw new Error('Refresh token não disponível');
    }

    console.log('🔄 Renovando token...');
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Falha ao renovar token');
    }

    const tokenData = await response.json();
    this.accessToken = tokenData.access_token;
    const expiryTime = Date.now() + (tokenData.expires_in * 1000);
    
    localStorage.setItem('google_drive_token', this.accessToken);
    localStorage.setItem('google_drive_token_expiry', expiryTime.toString());

    return tokenData;
  }

  async ensureValidToken() {
    const tokenExpiry = localStorage.getItem('google_drive_token_expiry');
    
    if (!this.accessToken || !tokenExpiry || Date.now() >= parseInt(tokenExpiry)) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.log('❌ Falha ao renovar token, solicitando nova autenticação...');
        throw new Error('Token expirado. Redirecionando para autenticação...');
      }
    }
  }

  // MÉTODO CORRIGIDO: isSignedIn
  isSignedIn() {
    try {
      const token = this.accessToken || localStorage.getItem('google_drive_token');
      const tokenExpiry = localStorage.getItem('google_drive_token_expiry');
      
      const isSignedIn = token && tokenExpiry && Date.now() < parseInt(tokenExpiry);
      console.log('🔐 Verificação de autenticação:', { isSignedIn, token: !!token, tokenExpiry });
      return isSignedIn;
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      return false;
    }
  }

  async uploadFile(file, onProgress = null) {
    console.log('📤 Iniciando upload do arquivo:', file.name);
    
    try {
      // Verificar autenticação usando o método corrigido
      if (!this.isSignedIn()) {
        console.log('🔐 Usuário não autenticado, redirecionando...');
        
        // Salvar arquivo temporariamente para upload após autenticação
        this.saveFileForLaterUpload(file);
        await this.authenticate();
        throw new Error('Redirecionando para autenticação...');
      }

      // Garantir token válido
      await this.ensureValidToken();

      if (!this.accessToken) {
        throw new Error('Token de acesso não disponível');
      }

      // Criar metadata do arquivo
      const metadata = {
        name: `product-${Date.now()}-${file.name}`,
        mimeType: file.type,
      };

      console.log('📄 Metadata:', metadata);

      // Criar FormData para upload multipart
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      console.log('🚀 Enviando upload para Google Drive...');

      // Fazer upload
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
        body: form,
      });

      console.log('📨 Resposta do upload:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro no upload:', response.status, errorText);
        
        // Se token expirou, tentar renovar e refazer upload
        if (response.status === 401) {
          console.log('🔄 Token expirado, tentando renovar...');
          localStorage.removeItem('google_drive_token');
          localStorage.removeItem('google_drive_token_expiry');
          this.accessToken = null;
          return this.uploadFile(file, onProgress);
        }
        
        throw new Error(`Upload falhou: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Upload concluído:', data);

      // Tornar o arquivo público
      console.log('🌐 Tornando arquivo público...');
      await this.makeFilePublic(data.id);
      
      // Retornar URL de visualização
      const viewUrl = `https://drive.google.com/uc?id=${data.id}&export=view`;
      console.log('🔗 URL do arquivo:', viewUrl);
      
      return viewUrl;

    } catch (error) {
      console.error('❌ Erro no processo de upload:', error);
      throw error;
    }
  }

  async makeFilePublic(fileId) {
    try {
      console.log('🔓 Tornando arquivo público:', fileId);
      
      const permission = {
        type: 'anyone',
        role: 'reader',
      };

      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(permission),
      });

      if (!response.ok) {
        console.warn('⚠️ Não foi possível tornar o arquivo público:', response.status);
        return;
      }

      console.log('✅ Arquivo tornado público com sucesso');
    } catch (error) {
      console.warn('⚠️ Erro ao tornar arquivo público:', error);
    }
  }

  // Métodos auxiliares para salvar arquivo temporariamente
  saveFileForLaterUpload(file) {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: file.type,
          data: e.target.result,
          timestamp: Date.now()
        };
        localStorage.setItem('pending_upload', JSON.stringify(fileData));
        console.log('💾 Arquivo salvo para upload posterior:', file.name);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Erro ao salvar arquivo para upload posterior:', error);
    }
  }

  getPendingUpload() {
    try {
      const pending = localStorage.getItem('pending_upload');
      if (pending) {
        const fileData = JSON.parse(pending);
        
        // Verificar se o arquivo não é muito antigo (max 10 minutos)
        if (Date.now() - fileData.timestamp > 10 * 60 * 1000) {
          localStorage.removeItem('pending_upload');
          return null;
        }
        
        // Converter data URL de volta para File
        const byteString = atob(fileData.data.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: fileData.type });
        const file = new File([blob], fileData.name, { type: fileData.type });
        
        localStorage.removeItem('pending_upload');
        console.log('📤 Arquivo pendente recuperado:', file.name);
        return file;
      }
      return null;
    } catch (error) {
      console.error('❌ Erro ao recuperar arquivo pendente:', error);
      localStorage.removeItem('pending_upload');
      return null;
    }
  }

  async revokeToken() {
    try {
      const token = this.accessToken || localStorage.getItem('google_drive_token');
      if (token) {
        await fetch('https://oauth2.googleapis.com/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            token: token,
          }),
        });
      }
      
      // Limpar dados locais
      this.accessToken = null;
      localStorage.removeItem('google_drive_token');
      localStorage.removeItem('google_drive_token_expiry');
      localStorage.removeItem('google_drive_refresh_token');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_return_path');
      localStorage.removeItem('pending_upload');
      
      console.log('🔓 Token revogado e dados limpos');
    } catch (error) {
      console.warn('⚠️ Erro ao revogar token:', error);
    }
  }

  getAuthStatus() {
    return {
      isSignedIn: this.isSignedIn(),
      hasRefreshToken: !!localStorage.getItem('google_drive_refresh_token'),
      tokenExpiry: localStorage.getItem('google_drive_token_expiry'),
    };
  }
}

export const googleDriveService = new GoogleDriveService();