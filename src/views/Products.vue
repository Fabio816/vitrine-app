<template>
  <div class="products-page">
    <!-- Header com Carrinho -->
    <div class="page-header">
      <h1>Nossos Produtos</h1>
      <div class="cart-indicator" @click="showCart = true">
        🛒 Carrinho ({{ cartTotalItems }})
        <span class="cart-total">R$ {{ formatPrice(cartTotalPrice) }}</span>
      </div>
    </div>

    <!-- Lista de Produtos -->
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
          <p class="stock" :class="{ 'low-stock': product.stock <= 2 }">
            Estoque: {{ product.stock }}
          </p>
        </div>
        
        <!-- Controles de Quantidade MELHORADOS -->
        <div class="quantity-controls">
          <div class="quantity-selector">
            <button 
              @click="decreaseTempQuantity(product.id)"
              :disabled="getTempQuantity(product.id) <= 1"
              class="qty-btn"
            >
              -
            </button>
            <span class="quantity">{{ getTempQuantity(product.id) }}</span>
            <button 
              @click="increaseTempQuantity(product.id)"
              :disabled="getTempQuantity(product.id) >= product.stock"
              class="qty-btn"
            >
              +
            </button>
          </div>
          
          <button 
            @click="addToCart(product)"
            :disabled="product.stock <= 0"
            class="add-to-cart-btn"
            :class="{ 'added': getCartQuantity(product.id) > 0 }"
          >
            {{ getCartQuantity(product.id) > 0 ? '✅ No Carrinho' : `🛒 Adicionar ${getTempQuantity(product.id)}x` }}
          </button>
        </div>

        <!-- Info do item no carrinho -->
        <div v-if="getCartQuantity(product.id) > 0" class="cart-info">
          <span class="in-cart-badge">
            ✅ {{ getCartQuantity(product.id) }}x no carrinho
          </span>
          <button @click="removeFromCart(product.id)" class="remove-small-btn">
            ❌
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading">Carregando produtos...</div>
    <div v-if="products.length === 0 && !loading" class="no-products">
      Nenhum produto disponível no momento.
    </div>

    <!-- Modal do Carrinho -->
    <div v-if="showCart" class="cart-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🛒 Seu Carrinho</h3>
          <button @click="showCart = false" class="close-btn">✕</button>
        </div>

        <div v-if="cartItems.length === 0" class="empty-cart">
          <p>Seu carrinho está vazio</p>
          <button @click="showCart = false" class="continue-shopping">Continuar Comprando</button>
        </div>

        <div v-else class="cart-content">
          <!-- Itens do Carrinho -->
          <div class="cart-items">
            <div v-for="item in cartItems" :key="item.id" class="cart-item">
              <div class="item-image">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name">
                <div v-else class="image-placeholder-small">📷</div>
              </div>
              
              <div class="item-details">
                <h4>{{ item.name }}</h4>
                <p class="item-price">R$ {{ formatPrice(item.price) }} cada</p>
                
                <div class="item-quantity">
                  <button @click="updateQuantity(item.id, item.quantity - 1)" class="qty-btn-sm">-</button>
                  <span class="quantity">{{ item.quantity }}x</span>
                  <button 
                    @click="updateQuantity(item.id, item.quantity + 1)" 
                    :disabled="item.quantity >= item.stock"
                    class="qty-btn-sm"
                  >
                    +
                  </button>
                </div>
                
                <p class="item-total">Total: R$ {{ formatPrice(item.price * item.quantity) }}</p>
              </div>
              
              <button @click="removeFromCart(item.id)" class="remove-btn">🗑️</button>
            </div>
          </div>

          <!-- Resumo do Pedido -->
          <div class="order-summary">
            <h4>📋 Resumo do Pedido</h4>
            
            <div class="summary-row">
              <span>Itens ({{ cartTotalItems }})</span>
              <span>R$ {{ formatPrice(cartSubtotal) }}</span>
            </div>
            
            <div class="summary-total">
              <strong>Total</strong>
              <strong>R$ {{ formatPrice(cartTotalPrice) }}</strong>
            </div>
          </div>

          <!-- Formulário de Entrega -->
          <div class="delivery-form">
            <h4>📍 Informações de Entrega</h4>
            
            <div class="form-group">
              <label>👤 Seu Nome *</label>
              <input v-model="orderInfo.name" type="text" placeholder="Digite seu nome" required>
            </div>
            
            <div class="form-group">
              <label>📞 Telefone/WhatsApp *</label>
              <input v-model="orderInfo.phone" type="tel" placeholder="(11) 99999-9999" required>
            </div>

            <div class="location-options">
              <label class="option-label">
                <input 
                  type="radio" 
                  v-model="locationOption" 
                  value="manual"
                  class="option-radio"
                >
                <span class="option-text">📝 Digitar endereço manualmente</span>
              </label>
              
              <label class="option-label">
                <input 
                  type="radio" 
                  v-model="locationOption" 
                  value="auto"
                  class="option-radio"
                >
                <span class="option-text">📍 Usar minha localização atual</span>
              </label>
            </div>

            <!-- Campo de Endereço Manual -->
            <div v-if="locationOption === 'manual'" class="form-group">
              <label>🏠 Endereço Completo</label>
              <textarea 
                v-model="orderInfo.address" 
                placeholder="Rua, número, bairro, complemento..."
                rows="3"
              ></textarea>
            </div>

            <!-- Localização Automática -->
            <div v-if="locationOption === 'auto'" class="auto-location">
              <button 
                @click="getCurrentLocation" 
                :disabled="gettingLocation"
                class="location-btn"
              >
                {{ gettingLocation ? '📍 Obtendo localização...' : '📍 Pegar Minha Localização' }}
              </button>
              
              <div v-if="orderInfo.address" class="location-result">
                <p>✅ Localização obtida:</p>
                <p class="location-text">{{ orderInfo.address }}</p>
              </div>
            </div>

            <!-- Observações -->
            <div class="form-group">
              <label>💭 Observações (opcional)</label>
              <textarea 
                v-model="orderInfo.notes" 
                placeholder="Alguma observação sobre o pedido?"
                rows="2"
              ></textarea>
            </div>
          </div>

          <!-- Ações do Carrinho -->
          <div class="cart-actions">
            <button @click="clearCart" class="btn-clear">🗑️ Limpar Carrinho</button>
            <button @click="finalizeOrder" :disabled="!canFinalizeOrder" class="btn-confirm">
              ✅ Finalizar Pedido - R$ {{ formatPrice(cartTotalPrice) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmação -->
    <div v-if="showConfirmation" class="confirmation-modal">
      <div class="modal-content">
        <div class="confirmation-header">
          <h3>🎉 Pedido Realizado!</h3>
        </div>
        
        <div class="confirmation-content">
          <p>✅ Seu pedido foi recebido com sucesso!</p>
          <p>Entraremos em contato em breve para confirmar.</p>
          
          <div class="order-details">
            <h4>Detalhes do Pedido:</h4>
            <p><strong>Número:</strong> #{{ lastOrderNumber }}</p>
            <p><strong>Total:</strong> R$ {{ formatPrice(cartTotalPrice) }}</p>
            <p><strong>Itens:</strong> {{ cartTotalItems }}</p>
          </div>
          
          <button @click="closeConfirmation" class="btn-close">Continuar Comprando</button>
        </div>
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
      showCart: false,
      showConfirmation: false,
      cartItems: [],
      tempQuantities: {}, // Quantidades temporárias antes de adicionar ao carrinho
      locationOption: 'manual',
      gettingLocation: false,
      lastOrderNumber: null,
      orderInfo: {
        name: '',
        phone: '',
        address: '',
        notes: ''
      }
    }
  },
  computed: {
    cartTotalItems() {
      return this.cartItems.reduce((total, item) => total + item.quantity, 0)
    },
    cartSubtotal() {
      return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    },
    cartTotalPrice() {
      return this.cartSubtotal
    },
    canFinalizeOrder() {
      return this.cartItems.length > 0 && 
             this.orderInfo.name.trim() && 
             this.orderInfo.phone.trim() &&
             (this.locationOption === 'manual' ? true : this.orderInfo.address.trim())
    }
  },
  async mounted() {
    await this.loadProducts()
    this.loadCartFromStorage()
    this.initializeTempQuantities()
  },
  methods: {
    // Inicializar quantidades temporárias
    initializeTempQuantities() {
  this.tempQuantities = {}
  this.products.forEach(product => {
    // Usar Vue.set para garantir reatividade
    this.$set(this.tempQuantities, product.id, 1)
  })
},

getTempQuantity(productId) {
  return this.tempQuantities[productId] || 1
},

increaseTempQuantity(productId) {
  const product = this.products.find(p => p.id === productId)
  const currentQuantity = this.getTempQuantity(productId)
  
  if (product && currentQuantity < product.stock) {
    // Usar Vue.set para garantir reatividade
    this.$set(this.tempQuantities, product.id, currentQuantity + 1)
  }
},

decreaseTempQuantity(productId) {
  const currentQuantity = this.getTempQuantity(productId)
  
  if (currentQuantity > 1) {
    // Usar Vue.set para garantir reatividade
    this.$set(this.tempQuantities, productId, currentQuantity - 1)
  }
},

    async loadProducts() {
      this.loading = true
      try {
        this.products = await productsService.getProducts()
        this.initializeTempQuantities()
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
        alert('Erro ao carregar produtos: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    // Carrinho - Gerenciamento (ATUALIZADO)
    getCartQuantity(productId) {
      const item = this.cartItems.find(item => item.id === productId)
      return item ? item.quantity : 0
    },

    addToCart(product) {
      const quantity = this.getTempQuantity(product.id)
      const existingItem = this.cartItems.find(item => item.id === product.id)
      
      if (existingItem) {
        // Se já existe, atualiza a quantidade
        const newQuantity = existingItem.quantity + quantity
        if (newQuantity <= product.stock) {
          existingItem.quantity = newQuantity
        }
      } else {
        // Se não existe, adiciona novo item
        this.cartItems.push({
          ...product,
          quantity: quantity
        })
      }
      
      // Reseta a quantidade temporária para 1
      this.$set(this.tempQuantities, product.id, 1)
      
      this.saveCartToStorage()
    },

    removeFromCart(productId) {
      this.cartItems = this.cartItems.filter(item => item.id !== productId)
      this.saveCartToStorage()
    },

    updateQuantity(productId, newQuantity) {
      const product = this.products.find(p => p.id === productId)
      
      if (newQuantity <= 0) {
        this.cartItems = this.cartItems.filter(item => item.id !== productId)
      } else if (product && newQuantity <= product.stock) {
        const item = this.cartItems.find(item => item.id === productId)
        if (item) {
          item.quantity = newQuantity
        }
      }
      
      this.saveCartToStorage()
    },

    clearCart() {
      this.cartItems = []
      this.saveCartToStorage()
    },

    // Localização
    async getCurrentLocation() {
      this.gettingLocation = true
      
      if (!navigator.geolocation) {
        alert('Geolocalização não é suportada pelo seu navegador')
        this.gettingLocation = false
        return
      }

      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          })
        })

        // Converter coordenadas para endereço (simulação)
        const address = await this.coordinatesToAddress(
          position.coords.latitude, 
          position.coords.longitude
        )
        
        this.orderInfo.address = address
      } catch (error) {
        console.error('Erro ao obter localização:', error)
        
        if (error.code === 1) {
          alert('Permissão de localização negada. Por favor, digite o endereço manualmente.')
        } else {
          alert('Erro ao obter localização. Por favor, digite o endereço manualmente.')
        }
        
        this.locationOption = 'manual'
      } finally {
        this.gettingLocation = false
      }
    },

    async coordinatesToAddress(lat, lng) {
      // Simulação - na prática você usaria Google Maps Geocoding API
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        const data = await response.json()
        
        if (data.display_name) {
          return data.display_name
        }
      } catch (error) {
        console.error('Erro ao converter coordenadas:', error)
      }
      
      // Fallback: retorna coordenadas
      return `Localização: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
    },

    // Pedido
    async finalizeOrder() {
      if (!this.canFinalizeOrder) return

      try {
        // Gerar número do pedido
        this.lastOrderNumber = 'P' + Date.now().toString().slice(-6)
        
        // Preparar dados do pedido
        const orderData = {
          orderNumber: this.lastOrderNumber,
          items: this.cartItems,
          total: this.cartTotalPrice,
          customerInfo: { ...this.orderInfo },
          orderedAt: new Date(),
          status: 'pending'
        }

        // Salvar pedido no Firebase
        await this.saveOrderToFirebase(orderData)
        
        // Enviar notificação para Telegram
        await this.sendOrderNotification(orderData)
        
        // Mostrar confirmação
        this.showConfirmation = true
        this.showCart = false
        this.clearCart()
        this.resetOrderInfo()
        
      } catch (error) {
        console.error('Erro ao finalizar pedido:', error)
        alert('Erro ao finalizar pedido: ' + error.message)
      }
    },

    async saveOrderToFirebase(orderData) {
      // Implementar salvamento no Firebase
      console.log('Salvando pedido no Firebase:', orderData)
      // await db.collection('orders').add(orderData)
    },

    async sendOrderNotification(orderData) {
      const itemsText = orderData.items.map(item => 
        `   • ${item.quantity}x ${item.name} - R$ ${this.formatPrice(item.price * item.quantity)}`
      ).join('\n')

      const message = `🛒 *NOVO PEDIDO!* #${orderData.orderNumber}

👤 *Cliente:* ${orderData.customerInfo.name}
📞 *Telefone:* ${orderData.customerInfo.phone}
📍 *Endereço:* ${orderData.customerInfo.address || 'Não informado'}
💭 *Observações:* ${orderData.customerInfo.notes || 'Nenhuma'}

📋 *Itens do Pedido:*
${itemsText}

💰 *Total do Pedido:* R$ ${this.formatPrice(orderData.total)}
⏰ *Data/Hora:* ${new Date(orderData.orderedAt).toLocaleString('pt-BR')}

🎯 *Status:* Pendente de confirmação`

      await telegramService.sendReservationNotification({
        productName: `Pedido #${orderData.orderNumber} (${orderData.items.length} itens)`,
        userInfo: orderData.customerInfo,
        reservedAt: orderData.orderedAt
      }, message)
    },

    // Utilitários
    saveCartToStorage() {
      localStorage.setItem('shopping_cart', JSON.stringify(this.cartItems))
    },

    loadCartFromStorage() {
      const savedCart = localStorage.getItem('shopping_cart')
      if (savedCart) {
        this.cartItems = JSON.parse(savedCart)
      }
    },

    resetOrderInfo() {
      this.orderInfo = {
        name: '',
        phone: '',
        address: '',
        notes: ''
      }
      this.locationOption = 'manual'
    },

    closeConfirmation() {
      this.showConfirmation = false
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
.products-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: #f8f9fa;
}

/* Header com Carrinho */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.page-header h1 {
  color: #2c3e50;
  margin: 0;
  font-size: 2em;
}

.cart-indicator {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

.cart-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.cart-total {
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.9em;
}

/* Grid de Produtos */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
  margin-bottom: 40px;
}

.product-card {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: #3498db;
}

.product-image {
  width: 100%;
  height: 200px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  background: #f8f9fa;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e9ecef;
  color: #6c757d;
  font-size: 3em;
  border-radius: 12px;
  border: 2px dashed #dee2e6;
}

.product-info {
  flex: 1;
  margin-bottom: 20px;
}

.product-info h3 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.3em;
  font-weight: 600;
}

.price {
  font-size: 1.5em;
  font-weight: bold;
  color: #27ae60;
  margin: 10px 0;
}

.stock {
  color: #7f8c8d;
  font-size: 0.9em;
  margin: 5px 0;
}

.low-stock {
  color: #e74c3c !important;
  font-weight: bold;
  background: #ffeaa7;
  padding: 2px 8px;
  border-radius: 4px;
}

/* Controles de Quantidade MELHORADOS */
.quantity-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 15px;
}

.quantity-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  background: #f8f9fa;
  padding: 10px;
  border-radius: 10px;
  border: 2px solid #e9ecef;
  transition: all 0.3s;
}

.quantity-selector:focus-within {
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.qty-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #3498db;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.2em;
  font-weight: bold;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: scale(1.1);
}

.qty-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.quantity {
  font-size: 1.3em;
  font-weight: bold;
  color: #2c3e50;
  min-width: 30px;
  text-align: center;
  background: white;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid #dee2e6;
}

.add-to-cart-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.add-to-cart-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.add-to-cart-btn:hover:not(:disabled)::before {
  width: 300px;
  height: 300px;
}

.add-to-cart-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #219a52, #1e8449);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.add-to-cart-btn:disabled {
  background: #95a5a6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.add-to-cart-btn.added {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  animation: pulse 0.6s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Info do item no carrinho */
.cart-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 15px;
  padding: 10px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.in-cart-badge {
  color: #155724;
  font-weight: 600;
  font-size: 0.9em;
}

.remove-small-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.remove-small-btn:hover {
  background: #c0392b;
  transform: scale(1.1);
}

/* Modal do Carrinho */
.cart-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  border-bottom: 2px solid #ecf0f1;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5em;
}

.close-btn {
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  font-size: 1.5em;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255,255,255,0.3);
}

/* Carrinho Vazio */
.empty-cart {
  text-align: center;
  padding: 60px 30px;
  color: #7f8c8d;
}

.empty-cart p {
  font-size: 1.2em;
  margin-bottom: 20px;
}

.continue-shopping {
  padding: 12px 30px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1em;
  transition: all 0.3s;
}

.continue-shopping:hover {
  background: #2980b9;
  transform: translateY(-2px);
}

/* Conteúdo do Carrinho */
.cart-content {
  padding: 0;
}

.cart-items {
  max-height: 300px;
  overflow-y: auto;
  padding: 20px;
  border-bottom: 2px solid #ecf0f1;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
}

.cart-item:hover {
  background: #e9ecef;
  transform: translateX(5px);
}

.cart-item:last-child {
  margin-bottom: 0;
}

.item-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder-small {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #dee2e6;
  color: #6c757d;
  font-size: 1.5em;
}

.item-details {
  flex: 1;
}

.item-details h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 1.1em;
}

.item-price {
  color: #7f8c8d;
  font-size: 0.9em;
  margin: 0 0 10px 0;
}

.item-quantity {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.qty-btn-sm {
  width: 30px;
  height: 30px;
  border: none;
  background: #3498db;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.qty-btn-sm:hover:not(:disabled) {
  background: #2980b9;
  transform: scale(1.1);
}

.qty-btn-sm:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.item-total {
  font-weight: bold;
  color: #27ae60;
  margin: 0;
  font-size: 1em;
}

.remove-btn {
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  padding: 8px 12px;
  font-size: 0.8em;
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #c0392b;
  transform: scale(1.1);
}

/* Resumo do Pedido */
.order-summary {
  padding: 25px 30px;
  background: #f8f9fa;
  border-bottom: 2px solid #ecf0f1;
}

.order-summary h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  color: #7f8c8d;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px solid #dee2e6;
  font-size: 1.2em;
  color: #2c3e50;
}

/* Formulário de Entrega */
.delivery-form {
  padding: 25px 30px;
}

.delivery-form h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 14px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1em;
  font-family: inherit;
  transition: all 0.3s;
  background: #fafafa;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Opções de Localização */
.location-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.option-label:hover {
  background: #e9ecef;
  border-color: #3498db;
}

.option-radio {
  margin: 0;
}

.option-text {
  font-weight: 500;
  color: #2c3e50;
}

/* Localização Automática */
.auto-location {
  margin-bottom: 20px;
}

.location-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.location-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #8e44ad, #7d3c98);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(155, 89, 182, 0.3);
}

.location-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.location-result {
  margin-top: 15px;
  padding: 15px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 8px;
  color: #155724;
}

.location-text {
  margin: 8px 0 0 0;
  font-weight: 500;
}

/* Ações do Carrinho */
.cart-actions {
  padding: 25px 30px;
  background: #f8f9fa;
  border-top: 2px solid #ecf0f1;
  display: flex;
  gap: 15px;
  border-radius: 0 0 20px 20px;
}

.btn-clear {
  flex: 1;
  padding: 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear:hover {
  background: #c0392b;
  transform: translateY(-2px);
}

.btn-confirm {
  flex: 2;
  padding: 16px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #219a52, #1e8449);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.btn-confirm:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Modal de Confirmação */
.confirmation-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
  padding: 20px;
}

.confirmation-header {
  padding: 25px 30px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border-radius: 20px 20px 0 0;
  text-align: center;
}

.confirmation-header h3 {
  margin: 0;
  font-size: 1.8em;
}

.confirmation-content {
  padding: 30px;
  text-align: center;
}

.confirmation-content p {
  font-size: 1.1em;
  margin-bottom: 15px;
  color: #2c3e50;
}

.order-details {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 10px;
  margin: 25px 0;
  text-align: left;
}

.order-details h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  text-align: center;
}

.order-details p {
  margin: 8px 0;
  color: #7f8c8d;
}

.btn-close {
  padding: 14px 30px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close:hover {
  background: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
}

/* Estados de Loading e Vazio */
.loading, .no-products {
  text-align: center;
  padding: 60px 30px;
  color: #7f8c8d;
  font-size: 1.2em;
  background: white;
  border-radius: 16px;
  margin: 20px 0;
}

/* Responsivo */
@media (max-width: 768px) {
  .products-page {
    padding: 15px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .cart-indicator {
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .cart-item {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .item-details {
    text-align: center;
  }
  
  .cart-actions {
    flex-direction: column;
  }
  
  .quantity-selector {
    gap: 10px;
  }
  
  .location-options {
    gap: 8px;
  }
  
  .option-label {
    padding: 12px;
  }
  
  .cart-info {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .product-card {
    padding: 20px;
  }
  
  .modal-header {
    padding: 20px;
  }
  
  .delivery-form {
    padding: 20px;
  }
  
  .cart-actions {
    padding: 20px;
  }
  
  .confirmation-content {
    padding: 20px;
  }
  
  .qty-btn {
    width: 35px;
    height: 35px;
    font-size: 1em;
  }
  
  .quantity {
    font-size: 1.1em;
    min-width: 25px;
  }
}
</style>