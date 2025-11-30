<template>
  <div class="admin-panel">
    <h2>Painel Administrativo</h2>
    
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

            <!-- URL da Imagem -->
            <div class="form-group">
              <input 
                v-model="newProduct.imageUrl" 
                type="url" 
                placeholder="🔗 Cole aqui a URL da imagem"
                class="url-input"
              >
              <small class="url-help">
                Dica: Use imagens do Unsplash, Pexels ou Google Images
              </small>
              
              <!-- Preview da Imagem -->
              <div v-if="newProduct.imageUrl" class="image-preview">
                <img :src="newProduct.imageUrl" alt="Preview do produto" @error="handleImageError">
                <button type="button" @click="removeImage" class="remove-image">❌ Remover</button>
              </div>
            </div>

            <div class="form-buttons">
              <button 
                type="submit" 
                :disabled="loading" 
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

        <div class="products-list">
          <h3>Produtos Cadastrados ({{ products.length }})</h3>
          <div v-if="loadingProducts" class="loading">Carregando produtos...</div>
          <div v-else>
            <div v-for="product in products" :key="product.id" class="product-item">
              <!-- Imagem do Produto -->
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
      error: ''
    }
  },
  async mounted() {
    await this.loadProducts()
  },
  methods: {
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

    async addProduct() {
      this.loading = true
      this.error = ''
      try {
        await productsService.addProduct(this.newProduct)
        
        // Reset do formulário
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
        
        // Reset do formulário
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
      
      // Scroll para o formulário
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

    handleImageError(event) {
      // Se a imagem não carregar, remove a URL
      this.newProduct.imageUrl = ''
      alert('❌ A URL da imagem é inválida. Por favor, use outra URL.')
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
      this.$emit('logout')
    }
  }
}
</script>

<style scoped>
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