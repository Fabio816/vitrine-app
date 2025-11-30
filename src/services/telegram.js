import axios from 'axios'

const TELEGRAM_BOT_TOKEN = 'SEU_BOT_TOKEN'
const TELEGRAM_CHAT_ID = 'SEU_CHAT_ID'

export const telegramService = {
  async sendReservationNotification(reservationInfo) {
    const message = `
🛒 NOVA RESERVA!

📦 Produto: ${reservationInfo.productName}
👤 Cliente: ${reservationInfo.userInfo.name}
📞 Telefone: ${reservationInfo.userInfo.phone}
📍 Endereço: ${reservationInfo.userInfo.address}
⏰ Reservado em: ${new Date(reservationInfo.reservedAt).toLocaleString()}
    `

    try {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem para Telegram:', error)
    }
  }
}