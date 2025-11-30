import { db, firebase } from '../firebase'

// Função para verificar se o Firebase está inicializado
const checkFirebase = () => {
  if (!db) {
    console.error('❌ Firebase não está inicializado!')
    throw new Error('Firebase não está configurado corretamente')
  }
  return true
}

// Função para fazer upload da imagem
const uploadImage = async (imageFile) => {
  if (!imageFile) return null
  
  try {
    // Cria uma referência para o storage
    const storage = firebase.storage()
    const storageRef = storage.ref()
    
    // Cria um nome único para a imagem
    const timestamp = Date.now()
    const imageName = `products/${timestamp}_${imageFile.name}`
    const imageRef = storageRef.child(imageName)
    
    // Faz o upload
    const snapshot = await imageRef.put(imageFile)
    
    // Obtém a URL de download
    const downloadURL = await snapshot.ref.getDownloadURL()
    
    console.log('✅ Imagem uploadada com sucesso:', downloadURL)
    return downloadURL
  } catch (error) {
    console.error('❌ Erro ao fazer upload da imagem:', error)
    throw new Error('Falha ao fazer upload da imagem')
  }
}

export const productsService = {
  async getProducts() {
    try {
      checkFirebase()
      console.log('🔍 Buscando produtos no Firebase...')
      
      const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get()
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('📦 Produtos carregados:', products)
      return products
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error)
      throw new Error(`Falha ao carregar produtos: ${error.message}`)
    }
  },

  async updateProduct(id, updates) {
    try {
      checkFirebase()
      console.log('✏️ Atualizando produto:', id, updates)
    
      await db.collection('products').doc(id).update(updates)
      console.log('✅ Produto atualizado com sucesso')
    
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error)
      throw new Error(`Falha ao atualizar produto: ${error.message}`)
    }
  },

  async deleteProduct(id) {
    try {
      checkFirebase()
      console.log('🗑️ Excluindo produto:', id)
      
      await db.collection('products').doc(id).delete()
      console.log('✅ Produto excluído com sucesso')
      
    } catch (error) {
      console.error('❌ Erro ao excluir produto:', error)
      throw new Error(`Falha ao excluir produto: ${error.message}`)
    }
  },

  async addProduct(product) {
    try {
      checkFirebase()
      console.log('➕ Adicionando produto:', product)
      
      const productData = {
        name: product.name,
        quantity: parseInt(product.quantity) || 0,
        stock: parseInt(product.stock) || 0,
        price: parseFloat(product.price) || 0,
        imageUrl: product.imageUrl || null, // Agora é URL
        createdAt: new Date()
      }
      
      console.log('💾 Salvando produto no Firestore:', productData)
      const result = await db.collection('products').add(productData)
      
      console.log('✅ Produto adicionado com ID:', result.id)
      return result
    } catch (error) {
      console.error('❌ Erro ao adicionar produto:', error)
      throw new Error(`Falha ao adicionar produto: ${error.message}`)
    }
  },

  async updateProduct(id, updates) {
    try {
      checkFirebase()
      return await db.collection('products').doc(id).update(updates)
    } catch (error) {
      console.error('❌ Erro ao atualizar produto:', error)
      throw error
    }
  },

  async reserveProduct(productId, userInfo) {
    try {
      checkFirebase()

      const productRef = db.collection('products').doc(productId)
      const productDoc = await productRef.get()
      
      if (!productDoc.exists) {
        throw new Error('Produto não encontrado')
      }

      const product = productDoc.data()
      
      if (product.stock <= 0) {
        throw new Error('Produto sem estoque')
      }

      // Atualiza estoque
      await productRef.update({
        stock: product.stock - 1
      })

      // Registra reserva
      await db.collection('reservations').add({
        productId,
        productName: product.name,
        userInfo,
        reservedAt: new Date(),
        status: 'pending'
      })

      return product
    } catch (error) {
      console.error('❌ Erro ao reservar produto:', error)
      throw error
    }
  }
}