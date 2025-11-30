<template>
  <div class="telegram-config">
    <h3>🤖 Configuração do Telegram</h3>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">
      Carregando configurações do Telegram...
    </div>

    <div v-else class="telegram-form">
      <!-- Configurações do Bot -->
      <div class="config-section">
        <h4>🔧 Configurações do Bot</h4>
        
        <div class="form-group">
          <label>Nome do Bot</label>
          <input 
            v-model="telegramConfig.botName" 
            type="text" 
            placeholder="Será preenchido automaticamente"
            class="form-input"
            disabled
          >
          <small class="help-text">
            Nome será atualizado automaticamente ao testar a conexão
          </small>
        </div>

        <div class="form-group">
          <label>Token do Bot *</label>
          <input 
            v-model="telegramConfig.botToken" 
            type="password" 
            placeholder="Digite o token do bot"
            class="form-input"
            required
          >
          <small class="help-text">
            Obtenha o token com o @BotFather no Telegram
          </small>
        </div>

        <div class="form-group">
          <label>Chat ID do Administrador *</label>
          <input 
            v-model="telegramConfig.adminChatId" 
            type="text" 
            placeholder="Digite o Chat ID do admin"
            class="form-input"
            required
          >
          <small class="help-text">
            ID do chat onde serão enviadas as notificações. Envie uma mensagem para @userinfobot no Telegram para obter seu Chat ID.
          </small>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input 
              v-model="telegramConfig.enabled" 
              type="checkbox" 
              class="checkbox-input"
            >
            <span class="checkbox-text">Ativar notificações automáticas</span>
          </label>
        </div>
      </div>

      <!-- Status do Bot -->
      <div class="config-section">
        <h4>📊 Status do Bot</h4>
        
        <div class="status-info">
          <p><strong>Status:</strong> 
            <span :class="botStatusClass">
              {{ botStatus }}
            </span>
          </p>
          <p v-if="telegramConfig.botName">
            <strong>Bot:</strong> @{{ telegramConfig.botName }}
          </p>
          <p v-if="lastTest">
            <strong>Último teste:</strong> {{ formatDate(lastTest) }}
          </p>
          <p>
            <strong>Notificações:</strong> 
            <span :class="telegramConfig.enabled ? 'status-on' : 'status-off'">
              {{ telegramConfig.enabled ? 'Ativadas' : 'Desativadas' }}
            </span>
          </p>
        </div>

        <div class="test-buttons">
          <button 
            @click="testBotConnection" 
            :disabled="testingBot || !telegramConfig.botToken"
            class="test-btn"
          >
            {{ testingBot ? 'Testando...' : '🧪 Testar Conexão' }}
          </button>
          
          <button 
            @click="sendTestMessage" 
            :disabled="testingMessage || !canSendTestMessage"
            class="test-btn"
          >
            {{ testingMessage ? 'Enviando...' : '📤 Enviar Mensagem de Teste' }}
          </button>
        </div>
      </div>

      <!-- Histórico de Mensagens -->
      <div class="config-section">
        <h4>📨 Histórico de Mensagens</h4>
        
        <div v-if="messages.length === 0" class="no-messages">
          <p>Nenhuma mensagem enviada ainda.</p>
        </div>
        
        <div v-else class="messages-list">
          <div 
            v-for="message in displayedMessages" 
            :key="message.id"
            class="message-item"
          >
            <div class="message-header">
              <span class="message-type">{{ message.type }}</span>
              <span class="message-date">{{ formatDate(message.timestamp) }}</span>
            </div>
            <p class="message-content">{{ message.content }}</p>
            <p class="message-status" :class="message.status">
              {{ message.status === 'success' ? '✅' : '❌' }} {{ message.status }}
            </p>
          </div>
        </div>
      </div>

      <!-- Ações -->
      <div class="action-buttons">
        <button 
          @click="saveConfig" 
          :disabled="saving || !hasChanges"
          class="save-btn"
        >
          {{ saving ? 'Salvando...' : '💾 Salvar Configurações' }}
          <span v-if="hasChanges" class="unsaved-indicator">*</span>
        </button>
        
        <button 
          @click="resetConfig" 
          class="reset-btn"
        >
          🔄 Restaurar Padrões
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { telegramService } from '../services/telegram'

export default {
  name: 'TelegramConfig',
  data() {
    return {
      loading: true,
      saving: false,
      testingBot: false,
      testingMessage: false,
      error: '',
      lastTest: null,
      messages: [],
      originalConfig: null,
      
      // Configuração com valores padrão para evitar null
      telegramConfig: {
        botName: '',
        botToken: '',
        adminChatId: '',
        enabled: false
      }
    }
  },
  computed: {
    botStatus() {
      if (!this.telegramConfig.botToken || this.telegramConfig.botToken.trim() === '') {
        return 'Não configurado'
      }
      if (!this.telegramConfig.adminChatId || this.telegramConfig.adminChatId.trim() === '') {
        return 'Configurado (sem Chat ID)'
      }
      return 'Configurado e pronto'
    },
    botStatusClass() {
      if (!this.telegramConfig.botToken || this.telegramConfig.botToken.trim() === '') {
        return 'status-off'
      }
      if (!this.telegramConfig.adminChatId || this.telegramConfig.adminChatId.trim() === '') {
        return 'status-warning'
      }
      return 'status-on'
    },
    canSendTestMessage() {
      return this.telegramConfig.botToken && 
             this.telegramConfig.botToken.trim() !== '' && 
             this.telegramConfig.adminChatId && 
             this.telegramConfig.adminChatId.trim() !== ''
    },
    displayedMessages() {
      return this.messages.slice().reverse().slice(0, 10)
    },
    hasChanges() {
      if (!this.originalConfig) return false
      return JSON.stringify(this.telegramConfig) !== JSON.stringify(this.originalConfig)
    }
  },
  async mounted() {
    await this.loadConfig()
  },
  methods: {
    async loadConfig() {
      this.loading = true
      this.error = ''
      try {
        const config = await telegramService.getConfig()
        
        // Garantir que não seja null
        this.telegramConfig = {
          botName: '',
          botToken: '',
          adminChatId: '',
          enabled: false,
          ...config
        }
        
        // Salvar configuração original para detectar mudanças
        this.originalConfig = { ...this.telegramConfig }
        
        // Carregar histórico do Firebase
        await this.loadMessageHistory()
        
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
        this.error = 'Erro ao carregar configurações do Telegram: ' + error.message
      } finally {
        this.loading = false
      }
    },

    async saveConfig() {
      this.saving = true
      this.error = ''
      try {
        await telegramService.saveConfig(this.telegramConfig)
        this.originalConfig = { ...this.telegramConfig }
        this.addMessage('Configuração', 'Configurações salvas com sucesso no Firebase', 'success')
      } catch (error) {
        console.error('Erro ao salvar configurações:', error)
        this.error = 'Erro ao salvar configurações: ' + error.message
        this.addMessage('Configuração', 'Erro ao salvar: ' + error.message, 'error')
      } finally {
        this.saving = false
      }
    },

    async testBotConnection() {
      this.testingBot = true
      this.error = ''
      try {
        console.log('🔍 Iniciando teste de conexão...')
        
        // Primeiro salva as configurações atuais se houver mudanças
        if (this.hasChanges) {
          await this.saveConfig()
          // Aguarda um pouco para garantir que salvou no Firebase
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Agora testa a conexão
        const result = await telegramService.testConnection(this.telegramConfig)
        
        if (result.success) {
          this.lastTest = new Date()
          this.addMessage('Teste de Conexão', `Conexão estabelecida com sucesso! Bot: @${result.botInfo.username}`, 'success')
          
          // Atualiza a configuração local com o nome do bot
          this.telegramConfig.botName = result.botInfo.username
          this.originalConfig = { ...this.telegramConfig }
        }
        
      } catch (error) {
        console.error('❌ Erro ao testar conexão:', error)
        this.error = 'Erro ao testar conexão: ' + error.message
        this.addMessage('Teste de Conexão', 'Falha na conexão: ' + error.message, 'error')
      } finally {
        this.testingBot = false
      }
    },

    async sendTestMessage() {
      this.testingMessage = true
      this.error = ''
      try {
        console.log('📤 Iniciando envio de mensagem de teste...')
        
        // Primeiro salva as configurações atuais se houver mudanças
        if (this.hasChanges) {
          await this.saveConfig()
          // Aguarda um pouco para garantir que salvou no Firebase
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // Agora envia a mensagem
        const success = await telegramService.sendTestMessage(this.telegramConfig)
        
        if (success) {
          this.addMessage('Mensagem de Teste', 'Mensagem de teste enviada com sucesso para o Telegram', 'success')
        }
        
      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error)
        this.addMessage('Mensagem de Teste', 'Erro ao enviar mensagem: ' + error.message, 'error')
        this.error = 'Erro ao enviar mensagem: ' + error.message
      } finally {
        this.testingMessage = false
      }
    },

    resetConfig() {
      if (confirm('Tem certeza que deseja restaurar as configurações padrão? Todas as configurações atuais serão perdidas.')) {
        this.telegramConfig = {
          botName: '',
          botToken: '',
          adminChatId: '',
          enabled: false
        }
      }
    },

    async addMessage(type, content, status) {
      const message = {
        id: Date.now().toString(),
        type,
        content,
        status,
        timestamp: new Date()
      }
      
      this.messages.unshift(message)
      
      // Manter apenas as últimas 10 mensagens na memória
      if (this.messages.length > 10) {
        this.messages = this.messages.slice(0, 10)
      }
      
      // Salvar no Firebase
      try {
        await telegramService.saveMessageHistory(message)
      } catch (error) {
        console.error('Erro ao salvar no Firebase, usando localStorage:', error)
        this.saveMessageHistoryToLocalStorage()
      }
    },

    saveMessageHistoryToLocalStorage() {
      try {
        localStorage.setItem('telegram_messages', JSON.stringify(this.messages.slice(0, 10)))
      } catch (error) {
        console.error('Erro ao salvar histórico no localStorage:', error)
      }
    },

    async loadMessageHistory() {
      try {
        this.messages = await telegramService.getMessageHistory(10)
      } catch (error) {
        console.error('Erro ao carregar histórico:', error)
        // Fallback para localStorage se Firebase falhar
        this.loadMessageHistoryFromLocalStorage()
      }
    },

    loadMessageHistoryFromLocalStorage() {
      try {
        const saved = localStorage.getItem('telegram_messages')
        if (saved) {
          this.messages = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Erro ao carregar histórico do localStorage:', error)
      }
    },

    formatDate(date) {
      if (!date) return 'Nunca'
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
.telegram-config {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.telegram-config h3 {
  color: #2c3e50;
  margin-bottom: 25px;
  text-align: center;
  font-size: 1.5em;
}

.config-section {
  background: white;
  padding: 25px;
  margin-bottom: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.config-section h4 {
  color: #3498db;
  margin-bottom: 20px;
  font-size: 1.2em;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
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

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  background: #fafafa;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
  background: white;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-input:disabled {
  background: #ecf0f1;
  color: #7f8c8d;
  cursor: not-allowed;
}

.help-text {
  display: block;
  margin-top: 6px;
  color: #7f8c8d;
  font-size: 12px;
  font-style: italic;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  margin-right: 10px;
  transform: scale(1.2);
}

.checkbox-text {
  font-weight: normal;
  color: #2c3e50;
}

.status-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status-info p {
  margin: 8px 0;
  color: #2c3e50;
}

.status-on {
  color: #27ae60;
  font-weight: bold;
}

.status-warning {
  color: #f39c12;
  font-weight: bold;
}

.status-off {
  color: #e74c3c;
  font-weight: bold;
}

.test-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-btn {
  flex: 1;
  padding: 12px 20px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  min-width: 180px;
}

.test-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2980b9, #2471a3);
  transform: translateY(-2px);
}

.test-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.no-messages {
  text-align: center;
  padding: 30px;
  color: #7f8c8d;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #bdc3c7;
}

.messages-list {
  max-height: 300px;
  overflow-y: auto;
}

.message-item {
  background: #f8f9fa;
  padding: 15px;
  margin-bottom: 12px;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-type {
  font-weight: bold;
  color: #2c3e50;
}

.message-date {
  color: #7f8c8d;
  font-size: 0.9em;
}

.message-content {
  color: #34495e;
  margin-bottom: 8px;
  word-break: break-word;
}

.message-status.success {
  color: #27ae60;
  font-weight: bold;
}

.message-status.error {
  color: #e74c3c;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  padding-top: 25px;
  border-top: 2px solid #ecf0f1;
}

.save-btn {
  flex: 2;
  padding: 16px 24px;
  background: linear-gradient(135deg, #27ae60, #219a52);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #219a52, #1e8449);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
}

.save-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
}

.unsaved-indicator {
  color: #f39c12;
  font-weight: bold;
  margin-left: 5px;
}

.reset-btn {
  flex: 1;
  padding: 16px 24px;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #7f8c8d;
  transform: translateY(-2px);
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

@media (max-width: 768px) {
  .telegram-config {
    padding: 15px;
  }
  
  .test-buttons {
    flex-direction: column;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .message-header {
    flex-direction: column;
    gap: 5px;
  }
}
</style>