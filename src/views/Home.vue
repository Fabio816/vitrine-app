<template>
  <div class="home">
    <div class="hero">
      <h1>Bem-vindo à Nossa Vitrine</h1>
      <p>Produtos com preços especiais para você!</p>
      <router-link to="/products" class="cta-button">Ver Produtos</router-link>
    </div>
    
    <div class="features">
      <div class="feature">
        <h3>🛒 Compre com Desconto</h3>
        <p>Produtos com preços melhores que o mercado</p>
      </div>
      <div class="feature">
        <h3>📱 Reserve pelo App</h3>
        <p>Facilidade na reserva dos produtos</p>
      </div>
      <div class="feature">
        <h3>🚚 Entrega Rápida</h3>
        <p>Entrega ágil para sua comodidade</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-radius: 10px;
  margin-bottom: 40px;
}

.hero h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
}

.cta-button {
  display: inline-block;
  background: white;
  color: #007bff;
  padding: 15px 30px;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  margin-top: 20px;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.feature {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.feature h3 {
  margin-bottom: 15px;
  color: #007bff;
}
</style>