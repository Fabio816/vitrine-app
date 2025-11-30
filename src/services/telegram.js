import axios from 'axios'

// Configurações salvas no localStorage
const TELEGRAM_CONFIG_KEY = 'telegram_config'

export const telegramService = {
  // Salvar configurações
  saveConfig(config) {
    try {
      localStorage.setItem(TELEGRAM_CONFIG_KEY, JSON.stringify(config))
      return true
    } catch (error) {
      console.error('Erro ao salvar configurações do Telegram:', error)
      return false
    }
  },

  // Carregar configurações
  loadConfig() {
    try {
      const config = localStorage.getItem(TELEGRAM_CONFIG_KEY)
      return config ? JSON.parse(config) : null
    } catch (error) {
      console.error('Erro ao carregar configurações do Telegram:', error)
      return null
    }
  },

  // Verificar se está configurado
  isConfigured() {
    const config = this.loadConfig()
    return !!(config && config.botToken && config.chatId)
  },

  // Enviar mensagem de teste
  async sendTestMessage() {
    const config = this.loadConfig()
    if (!config || !config.botToken || !config.chatId) {
      throw new Error('Telegram não configurado. Configure o bot token e chat ID.')
    }

    const message = `🤖 *TESTE DO BOT TELEGRAM*

✅ *Conexão bem-sucedida!*
Seu bot está configurado corretamente.

📊 *Informações:*
- 🤖 Bot: ${config.botName || 'Não identificado'}
- 👤 Chat ID: ${config.chatId}
- ⏰ Data: ${new Date().toLocaleString('pt-BR')}

🎉 Agora você receberá notificações de novas reservas!`

    try {
      const result = await this.sendMessage(message)
      console.log('✅ Mensagem de teste enviada com sucesso:', result)
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de teste:', error)
      
      // Mensagens de erro mais específicas do Telegram
      if (error.response && error.response.data) {
        const telegramError = error.response.data
        if (telegramError.error_code === 400) {
          throw new Error('Chat ID inválido. Verifique se o Chat ID está correto.')
        } else if (telegramError.error_code === 401) {
          throw new Error('Bot Token inválido. Verifique se o token está correto.')
        } else if (telegramError.error_code === 403) {
          throw new Error('Bot bloqueado pelo usuário. O bot precisa ser iniciado primeiro.')
        } else {
          throw new Error(`Erro do Telegram: ${telegramError.description || 'Erro desconhecido'}`)
        }
      }
      
      throw new Error(`Falha na comunicação com Telegram: ${error.message}`)
    }
  },

  // Enviar notificação de reserva
  async sendReservationNotification(reservationInfo) {
    const config = this.loadConfig()
    if (!config || !config.botToken || !config.chatId) {
      console.warn('Telegram não configurado. Pulando notificação.')
      return false
    }

    const message = `🛒 *NOVA RESERVA!*

📦 *Produto:* ${reservationInfo.productName}
👤 *Cliente:* ${reservationInfo.userInfo.name}
📞 *Telefone:* ${reservationInfo.userInfo.phone}
📍 *Endereço:* ${reservationInfo.userInfo.address}
⏰ *Reservado em:* ${new Date(reservationInfo.reservedAt).toLocaleString('pt-BR')}

💡 *Ação necessária:* Entre em contato com o cliente para confirmar a reserva!`

    try {
      await this.sendMessage(message)
      console.log('✅ Notificação enviada para Telegram')
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar notificação para Telegram:', error)
      return false
    }
  },

  // Método interno para enviar mensagem
  async sendMessage(text) {
    const config = this.loadConfig()
    if (!config || !config.botToken || !config.chatId) {
      throw new Error('Telegram não configurado')
    }

    // Validações básicas
    if (!config.botToken.startsWith('') || config.botToken.split(':').length !== 2) {
      throw new Error('Formato do Bot Token inválido. Deve ser no formato: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz')
    }

    if (isNaN(config.chatId) || config.chatId.trim() === '') {
      throw new Error('Chat ID deve conter apenas números')
    }

    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`
    
    console.log('📤 Enviando mensagem para Telegram...', {
      url: url.replace(config.botToken, 'TOKEN_OCULTADO'),
      chatId: config.chatId,
      textLength: text.length
    })

    const response = await axios.post(url, {
      chat_id: config.chatId,
      text: text,
      parse_mode: 'Markdown'
    }, {
      timeout: 10000 // 10 segundos timeout
    })

    return response.data
  },

  // Validar configurações
  async validateConfig(botToken, chatId) {
    console.log('🔍 Validando configurações do Telegram...', {
      botToken: botToken ? `${botToken.substring(0, 10)}...` : 'vazio',
      chatId: chatId ? chatId : 'vazio'
    })

    if (!botToken || !chatId) {
      throw new Error('Bot Token e Chat ID são obrigatórios')
    }

    // Validações básicas
    if (!botToken.startsWith('') || botToken.split(':').length !== 2) {
      throw new Error('Formato do Bot Token inválido. Exemplo correto: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz')
    }

    if (isNaN(chatId) || chatId.trim() === '') {
      throw new Error('Chat ID deve conter apenas números')
    }

    // Testa a conexão enviando uma mensagem de teste
    const testConfig = { 
      botToken: botToken.trim(), 
      chatId: chatId.trim(),
      botName: 'Bot de Teste'
    }
    
    const tempSave = this.saveConfig(testConfig)
    
    if (!tempSave) {
      throw new Error('Erro ao salvar configurações temporárias')
    }

    try {
      await this.sendTestMessage()
      return true
    } catch (error) {
      // Remove as configurações inválidas
      localStorage.removeItem(TELEGRAM_CONFIG_KEY)
      throw error
    }
  },

  // Método para obter informações do bot (debug)
  async getBotInfo(botToken) {
    if (!botToken) {
      throw new Error('Bot Token é obrigatório')
    }

    const url = `https://api.telegram.org/bot${botToken}/getMe`
    
    try {
      const response = await axios.get(url, { timeout: 5000 })
      return response.data
    } catch (error) {
      if (error.response && error.response.data) {
        const telegramError = error.response.data
        if (telegramError.error_code === 401) {
          throw new Error('Bot Token inválido ou expirado')
        }
      }
      throw new Error(`Erro ao verificar bot: ${error.message}`)
    }
  }
}