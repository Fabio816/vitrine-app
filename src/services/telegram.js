// services/telegram.js
import { db } from '../firebase'
import { collection, doc, getDoc, setDoc, updateDoc, query, orderBy, limit, getDocs } from 'firebase/firestore'

export const telegramService = {
  async getConfig() {
    try {
      const configRef = doc(db, 'config', 'telegram')
      const configSnap = await getDoc(configRef)
      
      if (configSnap.exists()) {
        const data = configSnap.data()
        console.log('📋 Configuração carregada do Firebase:', data)
        return data
      } else {
        // Retorna configuração padrão se não existir
        const defaultConfig = {
          botName: '',
          botToken: '',
          adminChatId: '',
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        console.log('📋 Criando configuração padrão no Firebase')
        await setDoc(configRef, defaultConfig)
        return defaultConfig
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações do Telegram:', error)
      throw new Error('Não foi possível carregar as configurações do Telegram')
    }
  },

  async saveConfig(config) {
    try {
      const configRef = doc(db, 'config', 'telegram')
      console.log('💾 Salvando configuração no Firebase:', config)
      
      await setDoc(configRef, {
        ...config,
        updatedAt: new Date()
      }, { merge: true })
      
      console.log('✅ Configuração salva com sucesso')
      return true
    } catch (error) {
      console.error('❌ Erro ao salvar configurações do Telegram:', error)
      throw new Error('Não foi possível salvar as configurações do Telegram')
    }
  },

  async testConnection(config = null) {
    try {
      // Se não receber config como parâmetro, carrega do Firebase
      let telegramConfig = config
      if (!telegramConfig) {
        telegramConfig = await this.getConfig()
      }
      
      console.log('🔍 Testando conexão com configuração:', telegramConfig)
      
      if (!telegramConfig.botToken || telegramConfig.botToken.trim() === '') {
        throw new Error('Token do bot não configurado. Salve as configurações primeiro.')
      }

      // Teste real da API do Telegram
      const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/getMe`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.description || 'Token inválido ou bot não encontrado')
      }
      
      const data = await response.json()
      
      if (data.ok && data.result) {
        console.log('✅ Bot encontrado:', data.result)
        
        // Atualiza o nome do bot automaticamente se for diferente
        if (telegramConfig.botName !== data.result.username) {
          await this.saveConfig({
            ...telegramConfig,
            botName: data.result.username
          })
        }
        
        return {
          success: true,
          botInfo: data.result
        }
      } else {
        throw new Error('Resposta inválida da API do Telegram')
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar conexão do Telegram:', error)
      throw error
    }
  },

  async sendTestMessage(config = null) {
    try {
      // Se não receber config como parâmetro, carrega do Firebase
      let telegramConfig = config
      if (!telegramConfig) {
        telegramConfig = await this.getConfig()
      }
      
      console.log('📤 Enviando mensagem de teste com configuração:', telegramConfig)
      
      if (!telegramConfig.botToken || telegramConfig.botToken.trim() === '') {
        throw new Error('Token do bot não configurado')
      }
      
      if (!telegramConfig.adminChatId || telegramConfig.adminChatId.trim() === '') {
        throw new Error('Chat ID do administrador não configurado')
      }

      const message = `🤖 *Teste do Bot* ✅

Esta é uma mensagem de teste do seu bot de notificações.

*Configurações:*
• Bot: @${telegramConfig.botName || 'Não configurado'}
• Chat ID: ${telegramConfig.adminChatId}
• Horário: ${new Date().toLocaleString('pt-BR')}

Se você recebeu esta mensagem, o bot está funcionando corretamente! 🎉

*Próximos passos:*
1. Configure os produtos no painel administrativo
2. As notificações serão enviadas automaticamente
3. Monitore os pedidos por aqui`

      const response = await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramConfig.adminChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.description || 'Erro ao enviar mensagem')
      }

      console.log('✅ Mensagem de teste enviada com sucesso')
      return true
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de teste:', error)
      throw error
    }
  },

  async sendReservationNotification(reservationData, customMessage = null) {
    try {
      const config = await this.getConfig()
      
      if (!config.botToken || !config.adminChatId || !config.enabled) {
        console.log('Telegram não configurado ou desativado')
        return false
      }

      const message = customMessage || this.formatReservationMessage(reservationData)

      const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: config.adminChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      })

      if (!response.ok) {
        console.error('Erro ao enviar notificação:', await response.json())
        return false
      }

      return true
      
    } catch (error) {
      console.error('Erro ao enviar notificação de reserva:', error)
      return false
    }
  },

  formatReservationMessage(reservationData) {
    const itemsText = reservationData.items.map(item => 
      `   • ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`
    ).join('\n')

    return `🛒 *NOVA RESERVA!* #${reservationData.orderNumber}

👤 *Cliente:* ${reservationData.customerInfo.name}
📞 *Telefone:* ${reservationData.customerInfo.phone}
📍 *Endereço:* ${reservationData.customerInfo.address || 'Não informado'}
💭 *Observações:* ${reservationData.customerInfo.notes || 'Nenhuma'}

📋 *Itens Reservados:*
${itemsText}

💰 *Total:* R$ ${reservationData.total.toFixed(2)}
⏰ *Data/Hora:* ${reservationData.orderedAt.toLocaleString('pt-BR')}

🎯 *Status:* Pendente de confirmação`
  },

  // Método para salvar histórico de mensagens no Firebase
  async saveMessageHistory(message) {
    try {
      const messagesRef = collection(db, 'telegram_messages')
      await setDoc(doc(messagesRef), {
        ...message,
        createdAt: new Date()
      })
    } catch (error) {
      console.error('Erro ao salvar histórico de mensagens:', error)
    }
  },

  // Método para carregar histórico de mensagens do Firebase
  async getMessageHistory(limitCount = 10) {
    try {
      const messagesRef = collection(db, 'telegram_messages')
      const q = query(
        messagesRef, 
        orderBy('createdAt', 'desc'), 
        limit(limitCount)
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erro ao carregar histórico de mensagens:', error)
      return []
    }
  }
}