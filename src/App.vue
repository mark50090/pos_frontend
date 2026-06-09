<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- Navigation header (Only show if authenticated) -->
    <header v-if="auth.isAuthenticated" class="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur bg-white/80">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <span class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                POS App
              </span>
            </div>
            <nav class="ml-8 flex space-x-4 items-center">
              <RouterLink 
                to="/" 
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                active-class="bg-indigo-50 text-indigo-600 font-semibold"
              >
                หน้าแรก
              </RouterLink>
              <RouterLink 
                to="/about" 
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                active-class="bg-indigo-50 text-indigo-600 font-semibold"
              >
                เกี่ยวกับเรา
              </RouterLink>
            </nav>
          </div>

          <!-- User Info and Logout -->
          <div class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-semibold text-gray-800">{{ auth.user?.name }}</p>
              <p class="text-xs text-indigo-600 font-medium">{{ auth.user?.role }}</p>
            </div>
            <button 
              @click="handleLogout"
              class="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-150 transition-all active:scale-95"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-grow">
      <RouterView v-slot="{ Component }">
        <transition 
          name="fade" 
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>
  </div>
</template>

<style>
/* Page transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
