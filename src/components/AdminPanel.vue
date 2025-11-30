<template>
  <div class="admin-panel">
    <h2>Painel Administrativo</h2>
    
    <!-- Status do Google Drive -->
    <div v-if="driveInitialized" class="drive-status">
      <div v-if="isGoogleDriveConnected" class="status-connected">
        ✅ Google Drive Conectado
      </div>
      <div v-else class="status-disconnected">
        ⚠️ Google Drive não conectado
        <button @click="connectGoogleDrive" class="connect-btn">
          🔗 Conectar
        </button>
      </div>
      </div>
    
    <!-- Abas de Navegação -->
    <div class="admin-tabs">
      <button 
        @click="currentTab = 'products'" 
        :class="{ active: currentTab === 'products' }"
        class="tab-btn"
      >
        📦 Produtos
      </button>
      <button 
        @click="currentTab = 'telegram'" 
        :class="{ active: currentTab === 'telegram' }"
        class="tab-btn"
      >
        🤖 Telegram
      </button>
      <button 
        @click="currentTab = 'reservations'" 
        :class="{ active: currentTab === 'reservations' }"
        class="tab-btn"
      >
        📋 Reservas
      </button>
    </div>

    <!-- Conteúdo das Abas -->
    <div class="tab-content">
      
      <!-- Aba Produtos -->
      <div v-if="currentTab === 'products'" class="tab-pane">
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <div class="add-product-form">
          <h3>{{ editingProduct ? 'Editar Produto' : 'Adicionar Produto' }}</h3>
          <form @submit.prevent="editingProduct ? updateProduct() : addProduct()">
            <!-- Campo de Nome -->
            <div class="form-group">
              <input 
                v-model="newProduct.name" 
                type="text" 
                placeholder="Nome do produto" 
                required
              >
            </div>

            <!-- Campos Numéricos -->
            <div class="form-group">
              <input 
                v-model.number="newProduct.quantity" 
                type="number" 
                placeholder="Quantidade total" 
                required
                min="0"
              >
            </div>

            <div class="form-group">
              <input 
                v-model.number="newProduct.stock" 
                type="number" 
                placeholder="Estoque disponível" 
                required
                min="0"
              >
            </div>

            <div class="form-group">
              <input 
                v-model.number="newProduct.price" 
                type="number" 
                step="0.01" 
                placeholder="Preço (ex: 29.99)" 
                required
                min="0"
              >
            </div>

            <!-- Upload de Imagem -->
            <div class="form-group">
              <label class="upload-label">📷 Imagem do Produto</label>
              
              <!-- Status de Conectividade -->
              <div v-if="!driveInitialized" class="drive-warning">
                <small>⚠️ Usando upload local (imagens temporárias)</small>
              </div>
              
              <!-- Opções de Upload -->
              <div class="upload-options">
                <button 
                  type="button" 
                  @click="openCamera" 
                  class="upload-option-btn"
                  :disabled="uploading"
                >
                  📸 Tirar Foto
                </button>
                <button 
                  type="button" 
                  @click="triggerFileUpload" 
                  class="upload-option-btn"
                  :disabled="uploading"
                >
                  📁 Escolher da Galeria
                </button>
                <input 
                  ref="fileInput"
                  type="file" 
                  accept="image/*" 
                  @change="handleFileUpload"
                  style="display: none"
                >
              </div>

              <!-- Status do Upload -->
              <div v-if="uploading" class="upload-status">
                <div class="upload-progress">
                  <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <p>📤 Enviando... {{ uploadProgress }}%</p>
              </div>

              <!-- Preview da Imagem -->
              <div v-if="newProduct.imageUrl" class="image-preview">
                <img :src="newProduct.imageUrl" alt="Preview do produto">
                <div class="image-actions">
                  <button type="button" @click="removeImage" class="remove-image">❌ Remover</button>
                  <button type="button" @click="openCamera" class="retake-btn">📸 Nova Foto</button>
                </div>
              </div>

              <!-- Campo de URL (fallback) -->
              <div class="url-fallback">
                <small>Ou cole uma URL da internet:</small>
                <input 
                  v-model="newProduct.imageUrl" 
                  type="url" 
                  placeholder="🔗 Cole aqui a URL da imagem"
                  class="url-input"
                >
              </div>
            </div>

            <div class="form-buttons">
              <button 
                type="submit" 
                :disabled="loading || uploading" 
                class="submit-btn primary"
              >
                {{ loading ? 'Salvando...' : (editingProduct ? 'Atualizar Produto' : 'Adicionar Produto') }}
              </button>
              
              <button 
                v-if="editingProduct" 
                type="button" 
                @click="cancelEdit" 
                class="submit-btn secondary"
              >
                Cancelar Edição
              </button>
            </div>
          </form>
        </div>

        <!-- Lista de Produtos -->
        <div class="products-list">
          <h3>Produtos Cadastrados ({{ products.length }})</h3>
          <div v-if="loadingProducts" class="loading">Carregando produtos...</div>
          <div v-else>
            <div v-for="product in products" :key="product.id" class="product-item">
              <div class="product-image">
                <img 
                  v-if="product.imageUrl" 
                  :src="product.imageUrl" 
                  :alt="product.name"
                  @error="handleImageError"
                >
                <div v-else class="image-placeholder">📷</div>
              </div>
              
              <div class="product-info">
                <h4>{{ product.name }}</h4>
                <div class="product-details">
                  <p><strong>Quantidade:</strong> {{ product.quantity }}</p>
                  <p><strong>Estoque:</strong> 
                    <span :class="{ 'low-stock': product.stock <= 2 }">
                      {{ product.stock }}
                    </span>
                  </p>
                  <p><strong>Preço:</strong> R$ {{ formatPrice(product.price) }}</p>
                  <p class="product-date">
                    <small>Adicionado em: {{ formatDate(product.createdAt) }}</small>
                  </p>
                </div>
              </div>
              
              <div class="product-actions">
                <button @click="editProduct(product)" class="edit-btn">✏️ Editar</button>
                <button @click="deleteProduct(product)" class="delete-btn">🗑️ Excluir</button>
              </div>
            </div>
            <div v-if="products.length === 0" class="no-products">
              <p>Nenhum produto cadastrado.</p>
              <p>Adicione seu primeiro produto usando o formulário acima.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal da Câmera -->
      <div v-if="showCamera" class="camera-modal">
        <div class="camera-content">
          <div class="camera-header">
            <h3>📸 Tirar Foto</h3>
            <button @click="closeCamera" class="close-btn">✕</button>
          </div>
          
          <div class="camera-body">
            <!-- Video da Câmera -->
            <video 
              ref="cameraVideo" 
              autoplay 
              playsinline
              class="camera-view"
            ></video>
            
            <!-- Canvas para Captura -->
            <canvas ref="cameraCanvas" style="display: none"></canvas>
            
            <!-- Controles da Câmera -->
            <div class="camera-controls">
              <button @click="takePhoto" class="capture-btn" :disabled="!cameraActive">
                📷 Capturar
              </button>
              <button @click="switchCamera" class="switch-camera-btn" :disabled="!cameraActive">
                🔄 Alternar Câmera
              </button>
            </div>

            <!-- Preview da Foto -->
            <div v-if="capturedPhoto" class="photo-preview">
              <img :src="capturedPhoto" alt="Foto capturada">
              <div class="preview-actions">
                <button @click="uploadCapturedPhoto" class="confirm-btn">
                  ✅ Usar Esta Foto
                </button>
                <button @click="retakePhoto" class="retake-btn">
                  🔄 Tirar Outra
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Aba Telegram -->
      <div v-if="currentTab === 'telegram'" class="tab-pane">
        <TelegramConfig />
      </div>

      <!-- Aba Reservas -->
      <div v-if="currentTab === 'reservations'" class="tab-pane">
        <ReservationsList />
      </div>
    </div>

    <button @click="logout" class="logout-btn">🚪 Sair</button>
  </div>
</template>

<script>
import { productsService } from '../services/products'
import { googleDriveService } from '../services/googleDrive'
import TelegramConfig from './TelegramConfig.vue'
import ReservationsList from './ReservationsList.vue'

export default {
  name: 'AdminPanel',
  components: {
    TelegramConfig,
    ReservationsList
  },
  data() {
    return {
      currentTab: 'products',
      products: [],
      newProduct: {
        name: '',
        quantity: null,
        stock: null,
        price: null,
        imageUrl: ''
      },
      editingProduct: null,
      loading: false,
      loadingProducts: false,
      error: '',
      
      // ADICIONE ESTAS PROPRIEDADES FALTANTES:
      driveInitialized: false,
      uploading: false,
      uploadProgress: 0,
      showCamera: false,
      cameraActive: false,
      capturedPhoto: null,
      currentStream: null,
      facingMode: 'environment',
      googleDriveService: googleDriveService
    }
  },
  async mounted() {
    await this.loadProducts()
    await this.initializeGoogleDrive()
  },
  beforeUnmount() {
    this.stopCamera()
  },

  computed: {
  isGoogleDriveConnected() {
    return this.driveInitialized && this.googleDriveService.isSignedIn();
  }
},
  methods: {
    async connectGoogleDrive() {
    try {
      this.error = '';
      console.log('🔗 Conectando ao Google Drive...');
      
      await googleDriveService.authenticate();
      // O usuário será redirecionado para autenticação
      // Após retornar, o initializeGoogleDrive será chamado novamente
      
    } catch (error) {
      console.error('❌ Erro ao conectar Google Drive:', error);
      this.error = 'Erro ao conectar Google Drive: ' + error.message;
    }
  },
     async initializeGoogleDrive() {
    try {
      await googleDriveService.initialize();
      this.driveInitialized = true;
      
      // Verificar se há upload pendente após autenticação
      const pendingFile = googleDriveService.getPendingUpload();
      if (pendingFile) {
        console.log('📤 Retomando upload pendente...');
        await this.processPendingUpload(pendingFile);
      }
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Google Drive:', error);
    }
  },

  async processPendingUpload(file) {
    this.uploading = true;
    this.uploadProgress = 50; // Já estava no meio do processo
    
    try {
      const imageUrl = await googleDriveService.uploadFile(file);
      this.newProduct.imageUrl = imageUrl;
      alert('✅ Upload concluído com sucesso após autenticação!');
    } catch (error) {
      console.error('❌ Erro no upload pendente:', error);
      this.error = 'Erro ao fazer upload: ' + error.message;
    } finally {
      this.uploading = false;
      this.uploadProgress = 0;
    }
  },

    handleImageError(event) {
    // Se a imagem não carregar, substitui por placeholder
    const target = event.target
    const parent = target.parentElement
    
    // Criar placeholder
    const placeholder = document.createElement('div')
    placeholder.className = 'image-placeholder'
    placeholder.textContent = '📷'
    
    // Substituir imagem por placeholder
    parent.removeChild(target)
    parent.appendChild(placeholder)
  },

    async loadProducts() {
      this.loadingProducts = true
      this.error = ''
      try {
        this.products = await productsService.getProducts()
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        this.error = `Erro ao carregar produtos: ${error.message}`
      } finally {
        this.loadingProducts = false
      }
    },

    // MÉTODOS DA CÂMERA
    async startCamera() {
      try {
        const constraints = {
          video: { 
            facingMode: this.facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        }
        
        this.currentStream = await navigator.mediaDevices.getUserMedia(constraints)
        this.$refs.cameraVideo.srcObject = this.currentStream
        this.cameraActive = true
      } catch (error) {
        console.error('Erro ao acessar câmera:', error)
        this.error = 'Não foi possível acessar a câmera. Verifique as permissões.'
      }
    },

    stopCamera() {
      if (this.currentStream) {
        this.currentStream.getTracks().forEach(track => track.stop())
        this.currentStream = null
        this.cameraActive = false
      }
    },

    takePhoto() {
      const video = this.$refs.cameraVideo
      const canvas = this.$refs.cameraCanvas
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      this.capturedPhoto = canvas.toDataURL('image/jpeg', 0.8)
    },

    retakePhoto() {
      this.capturedPhoto = null
    },

    async switchCamera() {
      this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment'
      this.stopCamera()
      await this.startCamera()
    },

    async uploadCapturedPhoto() {
      if (!this.capturedPhoto) return
      
      this.uploading = true
      this.uploadProgress = 0
      
      try {
        // Converter data URL para Blob
        const response = await fetch(this.capturedPhoto)
        const blob = await response.blob()
        
        // Criar arquivo
        const file = new File([blob], `product-photo-${Date.now()}.jpg`, { 
          type: 'image/jpeg' 
        })
        
        // Fazer upload para o Google Drive
        const imageUrl = await this.uploadToGoogleDrive(file)
        
        this.newProduct.imageUrl = imageUrl
        this.closeCamera()
        
        alert('✅ Foto enviada para o Google Drive com sucesso!')
        
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error)
        
        if (error.error === 'access_denied') {
          this.error = 'Permissão negada para acessar o Google Drive.'
        } else if (error.error === 'popup_closed_by_user') {
          this.error = 'Autenticação cancelada. Tente novamente.'
        } else {
          this.error = 'Erro ao fazer upload da foto. Tente novamente.'
        }
      } finally {
        this.uploading = false
        this.uploadProgress = 0
      }
    },

    // UPLOAD DE ARQUIVO
    triggerFileUpload() {
      this.$refs.fileInput.click()
    },

    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      if (!file.type.startsWith('image/')) {
        this.error = 'Por favor, selecione apenas arquivos de imagem.'
        return
      }
      
      // Verificar tamanho do arquivo (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'A imagem deve ter no máximo 10MB.'
        return
      }
      
      this.uploading = true
      this.uploadProgress = 0
      
      try {
        const imageUrl = await this.uploadToGoogleDrive(file)
        this.newProduct.imageUrl = imageUrl
        alert('✅ Imagem enviada para o Google Drive com sucesso!')
      } catch (error) {
        console.error('Erro ao fazer upload do arquivo:', error)
        
        if (error.error === 'access_denied') {
          this.error = 'Permissão negada para acessar o Google Drive.'
        } else {
          this.error = 'Erro ao fazer upload da imagem: ' + (error.message || error.error_description || 'Tente novamente.')
        }
      } finally {
        this.uploading = false
        this.uploadProgress = 0
        event.target.value = ''
      }
    },

    // UPLOAD PARA GOOGLE DRIVE
   async uploadToGoogleDrive(file) {
  this.uploading = true;
  this.uploadProgress = 10;
  
  let uploadError = null; // ← Variável local para capturar o erro
  
  try {
    if (!this.driveInitialized) {
      await this.initializeGoogleDrive();
    }

    const driveUrl = await googleDriveService.uploadFile(file);
    this.uploadProgress = 100;
    return driveUrl;
    
  } catch (error) {
    console.error('❌ Erro no upload:', error);
    uploadError = error; // ← Captura o erro
    
    if (error.message.includes('redirecionando')) {
      // O usuário será redirecionado para autenticação
      this.uploading = false;
      return; // Não mostrar erro, pois é um fluxo normal
    }
    
    throw error;
  } finally {
    // Use a variável local uploadError em vez de error
    if (!uploadError || !uploadError.message.includes('redirecionando')) {
      this.uploading = false;
      this.uploadProgress = 0;
    }
  }
},

    // CONTROLE DA CÂMERA
    openCamera() {
      this.showCamera = true
      this.$nextTick(() => {
        this.startCamera()
      })
    },

    closeCamera() {
      this.stopCamera()
      this.showCamera = false
      this.capturedPhoto = null
    },

    // MÉTODOS EXISTENTES DO PRODUTO
    async addProduct() {
      this.loading = true
      this.error = ''
      try {
        await productsService.addProduct(this.newProduct)
        this.resetForm()
        await this.loadProducts()
        alert('✅ Produto adicionado com sucesso!')
      } catch (error) {
        console.error('Erro ao adicionar produto:', error)
        this.error = `Erro ao adicionar produto: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    async updateProduct() {
      this.loading = true
      this.error = ''
      try {
        await productsService.updateProduct(this.editingProduct.id, this.newProduct)
        this.cancelEdit()
        await this.loadProducts()
        alert('✅ Produto atualizado com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar produto:', error)
        this.error = `Erro ao atualizar produto: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    async deleteProduct(product) {
      if (!confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
        return
      }

      try {
        await productsService.deleteProduct(product.id)
        await this.loadProducts()
        alert('✅ Produto excluído com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
        alert(`Erro ao excluir produto: ${error.message}`)
      }
    },

    editProduct(product) {
      this.editingProduct = product
      this.newProduct = {
        name: product.name,
        quantity: product.quantity,
        stock: product.stock,
        price: product.price,
        imageUrl: product.imageUrl || ''
      }
      
      this.$nextTick(() => {
        document.querySelector('.add-product-form').scrollIntoView({ 
          behavior: 'smooth' 
        })
      })
    },

    cancelEdit() {
      this.editingProduct = null
      this.resetForm()
    },

    resetForm() {
      this.newProduct = { 
        name: '', 
        quantity: null, 
        stock: null, 
        price: null,
        imageUrl: '' 
      }
      this.error = ''
    },

    removeImage() {
      this.newProduct.imageUrl = ''
    },

    formatPrice(price) {
      return parseFloat(price).toFixed(2)
    },

    formatDate(date) {
      if (!date) return 'Data não disponível'
      const dateObj = date.toDate ? date.toDate() : new Date(date)
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    logout() {
      // Revogar token do Google ao sair
      if (googleDriveService.isSignedIn && googleDriveService.isSignedIn()) {
        googleDriveService.revokeToken()
      }
      this.$emit('logout')
    }
  }
}
</script>

<style scoped>
.status-connected {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  text-align: center;
}

.status-disconnected {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.connect-btn {
  padding: 8px 16px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.connect-btn:hover {
  background: #2980b9;
}

.drive-status {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  text-align: center;
  animation: slideDown 0.3s ease;
}

.drive-status.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.drive-status.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.drive-warning {
  background: #fff3cd;
  color: #856404;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 12px;
  border: 1px solid #ffeaa7;
  animation: fadeIn 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Estilos para o sistema de câmera */
.upload-label {
  display: block;
  margin-bottom: 12px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
}

.upload-options {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.upload-option-btn {
  flex: 1;
  padding: 14px 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 140px;
}

.upload-option-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #2471a3);
  transform: translateY(-2px);
}

.upload-option-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.upload-status {
  margin: 20px 0;
  padding: 15px;
  background: #ecf0f1;
  border-radius: 10px;
  text-align: center;
}

.upload-progress {
  width: 100%;
  height: 8px;
  background: #bdc3c7;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #27ae60, #219a52);
  transition: width 0.3s ease;
}

.image-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
}

.retake-btn {
  padding: 8px 16px;
  background: #f39c12;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.retake-btn:hover {
  background: #e67e22;
}

.url-fallback {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
}

.url-fallback small {
  display: block;
  margin-bottom: 8px;
  color: #7f8c8d;
}

/* Modal da Câmera */
.camera-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.camera-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

.camera-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #2c3e50;
  color: white;
}

.camera-header h3 {
  margin: 0;
  font-size: 1.3em;
}

.camera-body {
  padding: 20px;
  text-align: center;
}

.camera-view {
  width: 100%;
  max-width: 400px;
  height: 300px;
  background: #000;
  border-radius: 10px;
  margin-bottom: 20px;
  object-fit: cover;
}

.camera-controls {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.capture-btn, .switch-camera-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.capture-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  min-width: 120px;
}

.capture-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #c0392b, #a93226);
  transform: scale(1.05);
}

.switch-camera-btn {
  background: #3498db;
  color: white;
}

.switch-camera-btn:hover:not(:disabled) {
  background: #2980b9;
}

.photo-preview {
  margin-top: 20px;
  padding: 20px;
  background: #ecf0f1;
  border-radius: 10px;
}

.photo-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin-bottom: 15px;
  border: 3px solid #3498db;
}

.preview-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.confirm-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.confirm-btn:hover {
  background: linear-gradient(135deg, #219a52, #1e8449);
  transform: translateY(-2px);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Responsivo */
@media (max-width: 768px) {
  .upload-options {
    flex-direction: column;
  }
  
  .camera-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .camera-view {
    height: 250px;
  }
  
  .preview-actions {
    flex-direction: column;
  }
  
  .camera-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .drive-status {
    margin: 10px;
    font-size: 14px;
  }
}
.admin-panel {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Abas de Navegação */
.admin-tabs {
  display: flex;
  margin-bottom: 25px;
  background: white;
  border-radius: 12px;
  padding: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  gap: 5px;
}

.tab-btn {
  flex: 1;
  padding: 15px 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s;
  color: #7f8c8d;
}

.tab-btn.active {
  background: #3498db;
  color: white;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.3);
}

.tab-btn:hover:not(.active) {
  background: #ecf0f1;
  color: #2c3e50;
}

.tab-content {
  margin-top: 20px;
}

.tab-pane {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mantenha todo o resto do CSS existente abaixo */
.add-product-form {
  margin-bottom: 30px;
  padding: 30px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.add-product-form h3 {
  margin-bottom: 25px;
  color: #2c3e50;
  text-align: center;
  font-size: 1.5em;
  font-weight: 600;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 25px;
}

.add-product-form input {
  display: block;
  width: 100%;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  background: #fafafa;
  transition: all 0.3s ease;
  font-family: inherit;
}

.add-product-form input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  transform: translateY(-1px);
}

.add-product-form input::placeholder {
  color: #95a5a6;
  font-weight: 300;
}

.url-input {
  background: #f8f9fa !important;
  border-color: #bdc3c7 !important;
  font-size: 14px !important;
}

.url-help {
  display: block;
  margin-top: 8px;
  color: #7f8c8d;
  font-size: 12px;
  font-style: italic;
}

.image-preview {
  margin-top: 15px;
  text-align: center;
  padding: 20px;
  background: #ecf0f1;
  border-radius: 12px;
  border: 2px dashed #bdc3c7;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 10px;
  border: 3px solid #3498db;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.remove-image {
  margin-top: 12px;
  padding: 10px 20px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.3s;
}

.remove-image:hover {
  background: #c0392b;
}

.form-buttons {
  display: flex;
  gap: 15px;
  margin-top: 25px;
}

.submit-btn {
  flex: 1;
  padding: 16px 24px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.submit-btn.primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.submit-btn.primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #2471a3);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.submit-btn.secondary {
  background: #95a5a6;
  color: white;
}

.submit-btn.secondary:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #bdc3c7 !important;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

/* Lista de Produtos */
.products-list {
  margin-top: 40px;
}

.products-list h3 {
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 1.4em;
  font-weight: 600;
  text-align: center;
}

.product-item {
  border: 1px solid #e0e0e0;
  padding: 25px;
  margin-bottom: 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 20px;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
  position: relative;
}

.product-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  border-color: #3498db;
}

.product-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  background: #ecf0f1;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #bdc3c7;
  color: white;
  font-size: 2em;
  border-radius: 12px;
}

.product-info {
  flex: 1;
}

.product-info h4 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 1.3em;
  font-weight: 600;
}

.product-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.product-details p {
  margin: 4px 0;
  color: #34495e;
  font-size: 14px;
}

.low-stock {
  color: #e74c3c !important;
  font-weight: bold;
  background: #ffeaa7;
  padding: 2px 6px;
  border-radius: 4px;
}

.product-date {
  grid-column: 1 / -1;
  margin-top: 8px !important;
  color: #7f8c8d !important;
  font-style: italic;
}

.product-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: stretch;
}

.edit-btn, .delete-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
}

.edit-btn {
  background: #f39c12;
  color: white;
}

.edit-btn:hover {
  background: #e67e22;
  transform: translateY(-1px);
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.logout-btn {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 10px;
  cursor: pointer;
  margin-top: 30px;
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.error-message {
  background: #ffeaa7;
  color: #d35400;
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 25px;
  border: 2px solid #fdcb6e;
  font-weight: 500;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-size: 1.1em;
}

.no-products {
  text-align: center;
  padding: 50px 30px;
  color: #7f8c8d;
  background: white;
  border-radius: 16px;
  border: 2px dashed #bdc3c7;
}

.no-products p {
  margin: 10px 0;
  font-size: 1.1em;
}

/* Responsivo */
@media (max-width: 768px) {
  .admin-panel {
    padding: 15px;
  }
  
  .admin-tabs {
    flex-direction: column;
  }
  
  .add-product-form {
    padding: 20px;
  }
  
  .product-item {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  
  .product-details {
    grid-template-columns: 1fr;
    text-align: left;
  }
  
  .product-actions {
    flex-direction: row;
    justify-content: center;
    width: 100%;
    margin-top: 15px;
  }
  
  .form-buttons {
    flex-direction: column;
  }
  
  .product-image {
    width: 120px;
    height: 120px;
    margin: 0 auto;
  }
}
</style>