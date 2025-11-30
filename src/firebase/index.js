import firebase from 'firebase/compat/app'
import 'firebase/compat/auth'
import 'firebase/compat/firestore'
import 'firebase/compat/storage'

// SUAS CONFIGURAÇÕES DO FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBBs-xUCXqlKsGG1Sj-yrvjaLF4M3JWrS0",
  authDomain: "vitrine-app-873d7.firebaseapp.com",
  projectId: "vitrine-app-873d7",
  storageBucket: "vitrine-app-873d7.firebasestorage.app",
  messagingSenderId: "399273030644",
  appId: "1:399273030644:web:2593fa0d5e031557333fa1"
};

// Inicialize o Firebase
let app
let db
let storage

try {
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig)
  } else {
    app = firebase.app()
  }
  db = firebase.firestore()
  storage = firebase.storage()
  console.log('✅ Firebase inicializado com sucesso!')
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error)
}

export { db, storage, firebase }