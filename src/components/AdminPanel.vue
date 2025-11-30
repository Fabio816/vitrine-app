<template>
  <div class="admin-panel">
    <h2>Painel Administrativo</h2>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div class="add-product-form">
      <h3>Adicionar Produto</h3>
      <form @submit.prevent="addProduct">
        <!-- Campo de Nome -->
        <div class="form-group">
          <input 
            v-model="newProduct.name" 
            type="text" 
            placeholder="Nome do produto" 
            required
          >
        </div>

        <!-- Campos Numéricos com Placeholder Correto -->
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
          <label class="upload-label">
            📸 Foto do Produto
            <input 
              type="file" 
              accept="image/*" 
              capture="camera" 
              @change="handleImageUpload"
              class="file-input"
            >
            <span class="upload-button">Tirar Foto ou Escolher da Galeria</span>
          </label>
          
          <!-- Preview da Imagem -->
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="Preview do produto">
            <button type="button" @click="removeImage" class="remove-image">❌ Remover</button>
          </div>
        </div>

        <button type="submit" :disabled="loading" class="submit-btn">
          {{ loading ? 'Adicionando...' : 'Adicionar Produto' }}
        </button>
      </form>
    </div>

    <div class="products-list">
      <h3>Produtos Cadastrados</h3>
      <div v-if="loadingProducts" class="loading">Carregando produtos...</div>
      <div v-else>
        <div v-for="product in products" :key="product.id" class="product-item">
          <!-- Imagem do Produto -->
          <div v-if="product.imageUrl" class="product-image">
            <img :src="product.imageUrl" :alt="product.name">
          </div>
          <div v-else class="product-image placeholder">
            📷 Sem imagem
          </div>
          
          <div class="product-info">
            <h4>{{ product.name }}</h4>
            <p><strong>Quantidade:</strong> {{ product.quantity }}</p>
            <p><strong>Estoque:</strong> {{ product.stock }}</p>
            <p><strong>Preço:</strong> R$ {{ formatPrice(product.price) }}</p>
          </div>
          
          <button @click="editProduct(product)" class="edit-btn">Editar</button>
        </div>
        <div v-if="products.length === 0" class="no-products">
          Nenhum produto cadastrado.
        </div>
      </div>
    </div>

    <button @click="logout" class="logout-btn">Sair</button>
  </div>
</template>

<script>
import { productsService } from '../services/products'

export default {
  name: 'AdminPanel',
  data() {
    return {
      products: [],
      newProduct: {
        name: '',
        quantity: null, // Mudado para null para placeholder funcionar
        stock: null,
        price: null,
        imageFile: null
      },
      imagePreview: null,
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
        this.newProduct = { 
          name: '', 
          quantity: null, 
          stock: null, 
          price: null,
          imageFile: null 
        }
        this.imagePreview = null
        
        await this.loadProducts()
        alert('✅ Produto adicionado com sucesso!')
      } catch (error) {
        console.error('Erro ao adicionar produto:', error)
        this.error = `Erro ao adicionar produto: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        // Verifica se é uma imagem
        if (!file.type.startsWith('image/')) {
          alert('Por favor, selecione apenas imagens!')
          return
        }

        // Verifica o tamanho do arquivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('A imagem deve ter no máximo 5MB!')
          return
        }

        this.newProduct.imageFile = file
        
        // Cria preview da imagem
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },

    removeImage() {
      this.newProduct.imageFile = null
      this.imagePreview = null
      // Reseta o input file
      const fileInput = document.querySelector('.file-input')
      if (fileInput) fileInput.value = ''
    },

    formatPrice(price) {
      return parseFloat(price).toFixed(2)
    },

    editProduct(product) {
      // Implementar edição
      console.log('Editar produto:', product)
      alert(`Editar produto: ${product.name}`)
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
  max-width: 600px;
  margin: 0 auto;
}

.add-product-form {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: #f9f9f9;
}

.form-group {
  margin-bottom: 15px;
}

.add-product-form input {
  display: block;
  width: 100%;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background: white;
}

/* Estilo para inputs numéricos com placeholder visível */
.add-product-form input[type="number"]:placeholder-shown {
  color: #999;
}

.add-product-form input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

/* Upload de Imagem */
.upload-label {
  display: block;
  cursor: pointer;
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.upload-button {
  display: block;
  padding: 12px;
  background: #28a745;
  color: white;
  text-align: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-button:hover {
  background: #218838;
}

.image-preview {
  margin-top: 10px;
  text-align: center;
}

.image-preview img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  border: 2px solid #ddd;
}

.remove-image {
  margin-top: 10px;
  padding: 5px 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  padding: 15px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.submit-btn:hover:not(:disabled) {
  background: #0056b3;
}

/* Lista de Produtos */
.products-list {
  margin-top: 30px;
}

.product-item {
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
}

.product-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.product-image.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  font-size: 24px;
}

.product-info {
  flex: 1;
}

.product-info h4 {
  margin: 0 0 10px 0;
  color: #333;
}

.product-info p {
  margin: 5px 0;
  color: #666;
}

.edit-btn {
  padding: 8px 15px;
  background: #ffc107;
  color: #212529;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  align-self: flex-start;
}

.logout-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 20px;
  width: 100%;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #f5c6cb;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.no-products {
  text-align: center;
  padding: 30px;
  color: #666;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Responsivo */
@media (max-width: 768px) {
  .admin-panel {
    padding: 15px;
  }
  
  .product-item {
    flex-direction: column;
    text-align: center;
  }
  
  .edit-btn {
    align-self: center;
  }
}
</style>