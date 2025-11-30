import Vue from 'vue'
import Router from 'vue-router'
import Home from '../views/Home.vue'
import Products from '../views/Products.vue'
import Admin from '../views/Admin.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/products',
      name: 'Products',
      component: Products
    },
    {
      path: '/admin',
      name: 'Admin',
      component: Admin,
      meta: { requiresAuth: true }
    }
  ]
})