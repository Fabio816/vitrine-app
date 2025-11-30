<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h1>Vitrine App</h1>
      </div>
      <div class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link to="/products">Produtos</router-link>
        <router-link to="/admin">Admin</router-link>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  background: #f5f5f5;
}

.navbar {
  background: #007bff;
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-links a {
  color: white;
  text-decoration: none;
  margin-left: 20px;
}

.nav-links a.router-link-exact-active {
  font-weight: bold;
}

.main-content {
  padding: 20px;
  min-height: calc(100vh - 80px);
}

@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    padding: 1rem;
  }
  
  .nav-links {
    margin-top: 10px;
  }
  
  .nav-links a {
    margin: 0 10px;
  }
}
</style>