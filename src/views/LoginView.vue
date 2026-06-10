<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน'
    return
  }
  
  error.value = ''
  isLoading.value = true
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const success = auth.login(username.value, password.value)
  isLoading.value = false
  
  if (success) {
    router.push('/')
  } else {
    error.value = 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง'
  }
}

const quickLogin = (role) => {
  username.value = role
  password.value = '123456'
  handleLogin()
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 via-white to-violet-50">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <!-- POS Logo / Brand -->
      <div class="flex justify-center">
        <div class="p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
        เจ๊หยก POS
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        ร้านขนมจีนแม่บุญสร้าง - สาขา 1
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
      <div class="bg-white py-8 px-6 shadow-2xl rounded-2xl border border-gray-100/80 sm:px-10">
        <!-- Error Alert -->
        <div v-if="error" class="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-red-700 text-sm animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="username" class="block text-sm font-semibold text-gray-700">ชื่อผู้ใช้งาน</label>
            <div class="mt-1.5 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input 
                id="username" 
                v-model="username" 
                type="text" 
                required 
                placeholder="ระบุชื่อผู้ใช้งาน"
                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700">รหัสผ่าน</label>
            <div class="mt-1.5 relative rounded-md shadow-sm">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                id="password" 
                v-model="password" 
                type="password" 
                required 
                placeholder="ระบุรหัสผ่าน"
                class="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember-me" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg" />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700">จดจำฉันในระบบ</label>
            </div>
            <div class="text-sm">
              <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">ลืมรหัสผ่าน?</a>
            </div>
          </div>

          <div>
            <button 
              type="submit" 
              :disabled="isLoading"
              class="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-75 transition-all transform active:scale-98"
            >
              <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</span>
            </button>
          </div>
        </form>

        <!-- Quick Demo Profiles -->
        <div class="mt-8 border-t border-gray-150 pt-6">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">ทดลองใช้งานด่วน (Demo)</p>
          <div class="grid grid-cols-2 gap-3">
            <button 
              @click="quickLogin('admin')"
              class="inline-flex justify-center items-center px-4 py-2 border border-indigo-100 rounded-xl shadow-sm text-xs font-medium text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 transition-all"
            >
              ผู้จัดการ (Manager)
            </button>
            <button 
              @click="quickLogin('cashier')"
              class="inline-flex justify-center items-center px-4 py-2 border border-violet-100 rounded-xl shadow-sm text-xs font-medium text-violet-700 bg-violet-50/50 hover:bg-violet-50 transition-all"
            >
              พนักงานขาย (Cashier)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
