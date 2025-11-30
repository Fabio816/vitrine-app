<template>
  <div class="login-form">
    <h2>Admin Login</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Usuário:</label>
        <input 
          v-model="username" 
          type="text" 
          required 
        >
      </div>
      <div class="form-group">
        <label>Senha:</label>
        <input 
          v-model="password" 
          type="password" 
          required 
        >
      </div>
      <button type="submit" :disabled="loading">
        {{ loading ? 'Entrando...' : 'Entrar' }}
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script>
import { adminAuth } from '../services/auth'

export default {
  name: 'LoginForm',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = ''
      
      try {
        await adminAuth.login(this.username, this.password)
        this.$emit('login-success')
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

button {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>