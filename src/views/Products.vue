<template>
  <div class="products">
    <h1>Nossos Produtos</h1>
    
    <div class="products-grid">
      <ProductCard 
        v-for="product in products" 
        :key="product.id"
        :product="product"
        @reservation-made="loadProducts"
      />
    </div>
    
    <div v-if="loading" class="loading">Carregando produtos...</div>
    <div v-if="products.length === 0 && !loading" class="no-products">
      Nenhum produto disponível no momento.
    </div>
  </div>
</template>

<script>
import ProductCard from '../components/ProductCard.vue'
import { productsService } from '../services/products'

export default {
  name: 'Products',
  components: {
    ProductCard
  },
  data() {
    return {
      products: [],
      loading: true
    }
  },
  async mounted() {
    await this.loadProducts()
  },
  methods: {
    async loadProducts() {
      this.loading = true
      try {
        this.products = await productsService.getProducts()
      } catch (error) {
        console.error('Erro ao carregar produtos:', error)
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.loading, .no-products {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  color: #666;
}
</style>