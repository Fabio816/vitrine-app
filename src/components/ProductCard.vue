<template>
  <div class="product-card">
    <h3>{{ product.name }}</h3>
    <p class="price">R$ {{ product.price }}</p>
    <p class="stock">Estoque: {{ product.stock }}</p>
    
    <button 
      @click="showReservationForm = true" 
      :disabled="product.stock <= 0"
      class="reserve-btn"
    >
      {{ product.stock > 0 ? 'Reservar' : 'Sem Estoque' }}
    </button>

    <div v-if="showReservationForm" class="reservation-modal">
      <div class="modal-content">
        <h3>Reservar {{ product.name }}</h3>
        <form @submit.prevent="handleReservation">
          <input v-model="userInfo.name" placeholder="Seu nome" required>
          <input v-model="userInfo.phone" placeholder="Telefone" required>
          <textarea v-model="userInfo.address" placeholder="Endereço" required></textarea>
          <button type="submit">Confirmar Reserva</button>
          <button type="button" @click="showReservationForm = false">Cancelar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { productsService } from '../services/products'
import { telegramService } from '../services/telegram'

export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showReservationForm: false,
      userInfo: {
        name: '',
        phone: '',
        address: ''
      }
    }
  },
  methods: {
    async handleReservation() {
      try {
        const reservation = await productsService.reserveProduct(this.product.id, this.userInfo)
        
        // Envia notificação para Telegram
        await telegramService.sendReservationNotification({
          productName: this.product.name,
          userInfo: this.userInfo,
          reservedAt: new Date()
        })

        alert('Produto reservado com sucesso! Entraremos em contato.')
        this.showReservationForm = false
        this.userInfo = { name: '', phone: '', address: '' }
        
        // Atualiza a lista de produtos
        this.$emit('reservation-made')
      } catch (error) {
        alert('Erro ao reservar produto: ' + error.message)
      }
    }
  }
}
</script>

<style scoped>
.product-card {
  border: 1px solid #ddd;
  padding: 20px;
  margin: 10px;
  border-radius: 10px;
  text-align: center;
}

.price {
  font-size: 1.5em;
  font-weight: bold;
  color: #007bff;
}

.stock {
  color: #666;
}

.reserve-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

.reserve-btn:disabled {
  background: #ccc;
}

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
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
}

.modal-content input,
.modal-content textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}
</style>