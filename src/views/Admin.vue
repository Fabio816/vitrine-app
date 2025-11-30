<template>
  <div class="admin">
    <LoginForm 
      v-if="!isAuthenticated" 
      @login-success="handleLoginSuccess"
    />
    <AdminPanel 
      v-else 
      @logout="handleLogout"
    />
  </div>
</template>

<script>
import LoginForm from '../components/LoginForm.vue'
import AdminPanel from '../components/AdminPanel.vue'
import { adminAuth } from '../services/auth'

export default {
  name: 'Admin',
  components: {
    LoginForm,
    AdminPanel
  },
  data() {
    return {
      isAuthenticated: false
    }
  },
  mounted() {
    this.checkAuth()
  },
  methods: {
    checkAuth() {
      this.isAuthenticated = adminAuth.isAuthenticated()
    },
    handleLoginSuccess() {
      this.isAuthenticated = true
    },
    handleLogout() {
      adminAuth.logout()
      this.isAuthenticated = false
    }
  }
}
</script>

<style scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
}
</style>