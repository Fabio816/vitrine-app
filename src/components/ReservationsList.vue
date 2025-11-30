<template>
  <div class="reservations-list">
    <h3>📋 Lista de Reservas</h3>
    <div v-if="loading" class="loading">Carregando reservas...</div>
    <div v-else>
      <div v-if="reservations.length === 0" class="no-reservations">
        <p>Nenhuma reserva encontrada.</p>
      </div>
      <div v-else class="reservations-grid">
        <div v-for="reservation in reservations" :key="reservation.id" class="reservation-item">
          <div class="reservation-header">
            <h4>{{ reservation.productName }}</h4>
            <span :class="['status-badge', reservation.status]">
              {{ getStatusText(reservation.status) }}
            </span>
          </div>
          <div class="reservation-details">
            <p><strong>👤 Cliente:</strong> {{ reservation.userInfo.name }}</p>
            <p><strong>📞 Telefone:</strong> {{ reservation.userInfo.phone }}</p>
            <p><strong>📍 Endereço:</strong> {{ reservation.userInfo.address }}</p>
            <p><strong>⏰ Data:</strong> {{ formatDate(reservation.reservedAt) }}</p>
          </div>
          <div class="reservation-actions">
            <button @click="updateStatus(reservation.id, 'confirmed')" class="btn-confirm">
              ✅ Confirmar
            </button>
            <button @click="updateStatus(reservation.id, 'completed')" class="btn-complete">
              🎉 Concluir
            </button>
            <button @click="updateStatus(reservation.id, 'cancelled')" class="btn-cancel">
              ❌ Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../firebase'

export default {
  name: 'ReservationsList',
  data() {
    return {
      reservations: [],
      loading: true
    }
  },
  async mounted() {
    await this.loadReservations()
  },
  methods: {
    async loadReservations() {
      try {
        const snapshot = await db.collection('reservations')
          .orderBy('reservedAt', 'desc')
          .get()
        
        this.reservations = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error('Erro ao carregar reservas:', error)
        alert('Erro ao carregar reservas: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    async updateStatus(reservationId, newStatus) {
      try {
        await db.collection('reservations').doc(reservationId).update({
          status: newStatus,
          updatedAt: new Date()
        })
        
        await this.loadReservations()
        alert('Status atualizado com sucesso!')
      } catch (error) {
        console.error('Erro ao atualizar status:', error)
        alert('Erro ao atualizar status: ' + error.message)
      }
    },

    getStatusText(status) {
      const statusMap = {
        'pending': 'Pendente',
        'confirmed': 'Confirmada',
        'completed': 'Concluída',
        'cancelled': 'Cancelada'
      }
      return statusMap[status] || status
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
    }
  }
}
</script>

<style scoped>
.reservations-list {
  padding: 20px;
}

.reservations-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reservation-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-left: 4px solid #3498db;
}

.reservation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.reservation-header h4 {
  margin: 0;
  color: #2c3e50;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.confirmed {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.reservation-details p {
  margin: 8px 0;
  color: #555;
}

.reservation-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.reservation-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-confirm {
  background: #28a745;
  color: white;
}

.btn-complete {
  background: #17a2b8;
  color: white;
}

.btn-cancel {
  background: #dc3545;
  color: white;
}

.reservation-actions button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.loading, .no-reservations {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
}

@media (max-width: 768px) {
  .reservation-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .reservation-actions {
    justify-content: center;
  }
}
</style>