import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref(null)

  function login(username, password) {
    // Mock authentication check
    if (username && password) {
      isAuthenticated.value = true
      user.value = {
        name: username === 'admin' ? 'Administrator' : username,
        role: username === 'admin' ? 'Manager' : 'Cashier'
      }
      return true
    }
    return false
  }

  function logout() {
    isAuthenticated.value = false
    user.value = null
  }

  return { isAuthenticated, user, login, logout }
})
