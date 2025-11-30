<template>
  <div class="telegram-config">
    <div class="config-header">
      <h3>⚙️ Configuração do Telegram</h3>
      <p>Configure as notificações para receber alertas de novas reservas</p>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="success" class="success-message">
      {{ success }}
    </div>

    <form @submit.prevent="saveConfig" class="config-form">
      <div class="form-group">
        <label>🤖 Bot Token</label>
        <input 
          v-model="config.botToken"
          type="text" 
          placeholder="Ex: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
          required
          class="token-input"
        >
        <small class="help-text">
          Obtenha com o @BotFather no Telegram
        </small>
      </div>

      <div class="form-group">
        <label>👤 Chat ID</label>
        <input 
          v-model="config.chatId"
          type="text" 
          placeholder="Ex: 123456789"
          required
          class="chat-input"
        >
        <small class="help-text">
          Obtenha enviando mensagem para @userinfobot
        </small>
      </div>

      <div class="form-group">
        <label>📝 Nome do Bot (Opcional)</label>
        <input 
          v-model="config.botName"
          type="text" 
          placeholder="Ex: Meu Bot de Vendas"
          class="name-input"
        >
      </div>

      <div class="form-actions">
        <button 
          type="submit" 
          :disabled="loading" 
          class="btn btn-primary"
        >
          {{ loading ? 'Salvando...' : '💾 Salvar Configuração' }}
        </button>

        <button 
          v-if="isConfigured"
          type="button" 
          @click="sendTest"
          :disabled="testing"
          class="btn btn-secondary"
        >
          {{ testing ? 'Enviando...' : '📤 Enviar Mensagem de Teste' }}
        </button>

        <button 
          v-if="isConfigured"
          type="button" 
          @click="resetConfig"
          class="btn btn-danger"
        >
          🗑️ Limpar Configuração
        </button>
      </div>
    </form>

    <div v-if="isConfigured" class="config-status">
      <div class="status-card success">
        <h4>✅ Telegram Configurado</h4>
        <p>As notificações estão ativas e funcionando!</p>
        <div class="config-info">
          <p><strong>Bot:</strong> {{ currentConfig.botName || 'Não nomeado' }}</p>
          <p><strong>Chat ID:</strong> {{ currentConfig.chatId }}</p>
          <p><strong>Última verificação:</strong> {{ lastTest || 'Nunca' }}</p>
        </div>
      </div>
    </div>

    <div class="setup-guide">
      <h4>📋 Como Configurar</h4>
      <div class="guide-steps">
        <div class="step">
          <span class="step-number">1</span>
          <div class="step-content">
            <h5>Criar Bot no Telegram</h5>
            <p>Abra o Telegram, procure por <strong>@BotFather</strong> e envie <code>/newbot</code></p>
            <p>Siga as instruções e ao final copie o <strong>Bot Token</strong></p>
          </div>
        </div>

        <div class="step">
          <span class="step-number">2</span>
          <div class="step-content">
            <h5>Obter Chat ID</h5>
            <p>Procure por <strong>@userinfobot</strong> no Telegram</p>
            <p>Envie qualquer mensagem e ele responderá com seu <strong>Chat ID</strong></p>
          </div>
        </div>

        <div class="step">
          <span class="step-number">3</span>
          <div class="step-content">
            <h5>Configurar no App</h5>
            <p>Cole o <strong>Bot Token</strong> e <strong>Chat ID</strong> nos campos acima</p>
            <p>Clique em "Salvar Configuração" e depois "Enviar Mensagem de Teste"</p>
          </div>
        </div>
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
      config: {
        botToken: '',
        chatId: '',
        botName: ''
      },
      currentConfig: null,
      loading: false,
      testing: false,
      error: '',
      success: '',
      lastTest: ''
    }
  },
  computed: {
    isConfigured() {
      return telegramService.isConfigured()
    }
  },
  mounted() {
    this.loadCurrentConfig()
  },
  methods: {
    async verifyBotToken() {
    if (!this.config.botToken) {
      this.error = 'Digite o Bot Token primeiro'
      return
    }

    this.loading = true
    this.error = ''

    try {
      const botInfo = await telegramService.getBotInfo(this.config.botToken)
      this.success = `✅ Bot válido: ${botInfo.result.first_name} (@${botInfo.result.username})`
      this.config.botName = botInfo.result.first_name
    } catch (error) {
      this.error = `❌ ${error.message}`
    } finally {
      this.loading = false
    }
  },

  // No método saveConfig, adicione esta validação:
  async saveConfig() {
    this.loading = true
    this.error = ''
    this.success = ''

    // Limpa espaços em branco
    this.config.botToken = this.config.botToken.trim()
    this.config.chatId = this.config.chatId.trim()

    try {
      // Validações manuais antes de enviar para o Telegram
      if (!this.config.botToken.startsWith('') || this.config.botToken.split(':').length !== 2) {
        throw new Error('Formato do Bot Token inválido. Deve ser no formato: 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz')
      }

      if (isNaN(this.config.chatId) || this.config.chatId === '') {
        throw new Error('Chat ID deve conter apenas números')
      }

      // Valida as configurações com o Telegram
      await telegramService.validateConfig(this.config.botToken, this.config.chatId)
      
      // Salva as configurações completas
      const saveResult = telegramService.saveConfig(this.config)
      
      if (saveResult) {
        this.success = '✅ Configurações salvas com sucesso! O Telegram está configurado.'
        this.loadCurrentConfig()
        this.lastTest = new Date().toLocaleString('pt-BR')
      } else {
        throw new Error('Erro ao salvar configurações')
      }

    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      this.error = `❌ ${error.message}`
    } finally {
      this.loading = false
    }
  },
  
    loadCurrentConfig() {
      this.currentConfig = telegramService.loadConfig()
      if (this.currentConfig) {
        this.config = { ...this.currentConfig }
      }
    },

    async saveConfig() {
      this.loading = true
      this.error = ''
      this.success = ''

      try {
        // Valida as configurações
        await telegramService.validateConfig(this.config.botToken, this.config.chatId)
        
        // Salva as configurações completas
        const saveResult = telegramService.saveConfig(this.config)
        
        if (saveResult) {
          this.success = '✅ Configurações salvas com sucesso! O Telegram está configurado.'
          this.loadCurrentConfig()
          this.lastTest = new Date().toLocaleString('pt-BR')
        } else {
          throw new Error('Erro ao salvar configurações')
        }

      } catch (error) {
        console.error('Erro ao salvar configurações:', error)
        this.error = `Erro: ${error.message}`
      } finally {
        this.loading = false
      }
    },

    async sendTest() {
      this.testing = true
      this.error = ''
      this.success = ''

      try {
        await telegramService.sendTestMessage()
        this.success = '✅ Mensagem de teste enviada com sucesso! Verifique seu Telegram.'
        this.lastTest = new Date().toLocaleString('pt-BR')
      } catch (error) {
        console.error('Erro ao enviar teste:', error)
        this.error = `Erro ao enviar teste: ${error.message}`
      } finally {
        this.testing = false
      }
    },

    resetConfig() {
      if (confirm('Tem certeza que deseja limpar as configurações do Telegram?')) {
        localStorage.removeItem('telegram_config')
        this.config = { botToken: '', chatId: '', botName: '' }
        this.currentConfig = null
        this.success = 'Configurações do Telegram foram removidas.'
        this.error = ''
      }
    }
  }
}
</script>

<style scoped>
.telegram-config {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.config-header {
  text-align: center;
  margin-bottom: 30px;
}

.config-header h3 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.config-header p {
  color: #7f8c8d;
  font-size: 14px;
}

.config-form {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-bottom: 25px;
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

.form-group input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #3498db;
}

.help-text {
  display: block;
  margin-top: 5px;
  color: #7f8c8d;
  font-size: 12px;
}

.form-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  flex: 1;
  min-width: 120px;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
}

.btn-secondary {
  background: #2ecc71;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #27ae60;
}

.btn-danger {
  background: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background: #c0392b;
}

.btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.config-status {
  margin-bottom: 25px;
}

.status-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-left: 4px solid #2ecc71;
}

.status-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.config-info {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ecf0f1;
}

.config-info p {
  margin: 5px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.setup-guide {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.setup-guide h4 {
  color: #2c3e50;
  margin-bottom: 20px;
  text-align: center;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step {
  display: flex;
  gap: 15px;
  align-items: flex-start;
}

.step-number {
  background: #3498db;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h5 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.step-content p {
  margin: 4px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.step-content code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  color: #e74c3c;
}

.error-message {
  background: #ffeaa7;
  color: #d35400;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #fdcb6e;
}

.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #c3e6cb;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .step {
    flex-direction: column;
    text-align: center;
  }
  
  .step-number {
    align-self: center;
  }
}
</style>