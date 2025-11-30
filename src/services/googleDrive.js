// services/googleDrive.js
class GoogleDriveService {
  constructor() {
    this.CLIENT_ID = '399273030644-lundq4194al5gncn76iv97hq9b68d2j5.apps.googleusercontent.com';
    this.API_KEY = ''; // Opcional para APIs públicas
    this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
    this.tokenClient = null;
    this.gapiInited = false;
    this.gisInited = false;
  }

  async initialize() {
    return new Promise((resolve) => {
      // Carregar Google API Client
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = () => {
        gapi.load('client', async () => {
          await gapi.client.init({
            apiKey: this.API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          this.gapiInited = true;
          if (this.gisInited) resolve();
        });
      };
      document.head.appendChild(gapiScript);

      // Carregar Google Identity Services
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = () => {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: this.CLIENT_ID,
          scope: this.SCOPES,
          callback: '', // Definido posteriormente
        });
        this.gisInited = true;
        if (this.gapiInited) resolve();
      };
      document.head.appendChild(gisScript);
    });
  }

  async authenticate() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Google Drive não inicializado'));
        return;
      }

      this.tokenClient.callback = async (response) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }
        resolve(response);
      };

      // Verificar se já temos token válido
      const token = gapi.client.getToken();
      if (token !== null) {
        resolve(token);
      } else {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      }
    });
  }

  async uploadFile(file, onProgress = null) {
    try {
      // Autenticar
      await this.authenticate();

      // Criar metadata do arquivo
      const metadata = {
        name: `product-${Date.now()}-${file.name}`,
        mimeType: file.type,
        parents: ['root'] // Você pode especificar uma pasta específica aqui
      };

      // Criar FormData para upload
      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      // Fazer upload
      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gapi.client.getToken().access_token}`,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Gerar link público (precisa configurar permissões)
      await this.makeFilePublic(data.id);
      
      // Retornar URL acessível
      return `https://drive.google.com/uc?id=${data.id}&export=view`;

    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  }

  async makeFilePublic(fileId) {
    try {
      const permission = {
        type: 'anyone',
        role: 'reader',
      };

      await gapi.client.drive.permissions.create({
        fileId: fileId,
        resource: permission,
      });
    } catch (error) {
      console.warn('Não foi possível tornar o arquivo público:', error);
    }
  }

  async listFiles() {
    try {
      await this.authenticate();
      
      const response = await gapi.client.drive.files.list({
        pageSize: 10,
        fields: 'files(id, name, webViewLink, createdTime)',
      });
      
      return response.result.files;
    } catch (error) {
      console.error('Erro ao listar arquivos:', error);
      throw error;
    }
  }

  async revokeToken() {
    const token = gapi.client.getToken();
    if (token !== null) {
      await google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken(null);
    }
  }

  isSignedIn() {
    return gapi.client && gapi.client.getToken() !== null;
  }
}

export const googleDriveService = new GoogleDriveService();