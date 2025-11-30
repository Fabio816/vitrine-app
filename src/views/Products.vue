<template>
  <div class="products">
    <h1>Nossos Produtos</h1>
    
    <div class="products-grid">
      <div 
        v-for="product in products" 
        :key="product.id"
        class="product-card"
      >
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
          <h3>{{ product.name }}</h3>
          <p class="price">R$ {{ formatPrice(product.price) }}</p>
          <p class="stock">Estoque: {{ product.stock }}</p>
        </div>
        
        <button 
          @click="showReservationForm(product)" 
          :disabled="product.stock <= 0"
          class="reserve-btn"
        >
          {{ product.stock > 0 ? 'Reservar' : 'Sem Estoque' }}
        </button>
      </div>
    </div>
    
    <div v-if="loading" class="loading">Carregando produtos...</div>
    <div v-if="products.length === 0 && !loading" class="no-products">
      Nenhum produto disponível no momento.
    </div>

    <!-- Modal de Reserva -->
    <div v-if="showReservationModal" class="reservation-modal">
      <div class="modal-content">
        <h3>Reservar {{ selectedProduct.name }}</h3>
        <form @submit.prevent="handleReservation">
          <input v-model="userInfo.name" placeholder="Seu nome" required>
          <input v-model="userInfo.phone" placeholder="Telefone" required>
          <textarea v-model="userInfo.address" placeholder="Endereço" required></textarea>
          <div class="modal-buttons">
            <button type="submit">Confirmar Reserva</button>
            <button type="button" @click="closeReservationModal">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { productsService } from '../services/products'
import { telegramService } from '../services/telegram'

export default {
  name: 'Products',
  data() {
    return {
      products: [],
      loading: true,
      showReservationModal: false,
      selectedProduct: null,
      userInfo: {
        name: '',
        phone: '',
        address: ''
      }
    }
  },
  async mounted() {
    await this.loadProducts()
  },
  methods: {
    async loadProducts() {
      this.loading = true
      try {
        this.products = await productsService.getProducts()
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        alert('Erro ao carregar produtos: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    showReservationForm(product) {
      this.selectedProduct = product
      this.showReservationModal = true
    },

    closeReservationModal() {
      this.showReservationModal = false
      this.selectedProduct = null
      this.userInfo = { name: '', phone: '', address: '' }
    },

    async handleReservation() {
      try {
        await productsService.reserveProduct(this.selectedProduct.id, this.userInfo)
        
        // Envia notificação para Telegram
        await telegramService.sendReservationNotification({
          productName: this.selectedProduct.name,
          userInfo: this.userInfo,
          reservedAt: new Date()
        })

        alert('Produto reservado com sucesso! Entraremos em contato.')
        this.closeReservationModal()
        await this.loadProducts() // Recarrega a lista para atualizar estoque
      } catch (error) {
        alert('Erro ao reservar produto: ' + error.message)
      }
    },

    handleImageError(event) {
      event.target.style.display = 'none'
      const parent = event.target.parentElement
      const placeholder = document.createElement('div')
      placeholder.className = 'image-placeholder'
      placeholder.textContent = '📷'
      parent.appendChild(placeholder)
    },

    formatPrice(price) {
      return parseFloat(price).toFixed(2)
    }
  }
}
</script>

<style scoped>
.products {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.product-card {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 8px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  font-size: 48px;
}

.product-info h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2em;
}

.price {
  font-size: 1.4em;
  font-weight: bold;
  color: #007bff;
  margin: 10px 0;
}

.stock {
  color: #666;
  margin: 10px 0;
}

.reserve-btn {
  width: 100%;
  padding: 12px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.reserve-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.reserve-btn:hover:not(:disabled) {
  background: #218838;
}

/* Modal de Reserva */
.reservation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
  text-align: center;
  color: #333;
}

.modal-content input,
.modal-content textarea {
  width: 100%;
  margin-bottom: 15px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
}

.modal-content textarea {
  height: 80px;
  resize: vertical;
}

.modal-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.modal-buttons button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.modal-buttons button[type="submit"] {
  background: #007bff;
  color: white;
}

.modal-buttons button[type="button"] {
  background: #6c757d;
  color: white;
}

.loading, .no-products {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #666;
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
  
  .product-card {
    padding: 15px;
  }
}
</style>