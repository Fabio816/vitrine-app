import { auth } from '../firebase'

export const adminAuth = {
  login(email, password) {
    return new Promise((resolve, reject) => {
      if (email === 'admin' && password === '330330') {
        // Simula login admin
        localStorage.setItem('adminAuth', 'true')
        resolve({ success: true })
      } else {
        reject(new Error('Credenciais inválidas'))
      }
    })
  },

  logout() {
    localStorage.removeItem('adminAuth')
  },

  isAuthenticated() {
    return localStorage.getItem('adminAuth') === 'true'
  }
}