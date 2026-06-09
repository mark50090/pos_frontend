<script setup>
import { ref, computed } from 'vue'
import { usePosStore } from '../stores/pos'
import { useAuthStore } from '../stores/auth'

const pos = usePosStore()
const auth = useAuthStore()

// Selected Category
const activeCategory = ref('all')
const categories = [
  { id: 'all', name: 'ทั้งหมด' },
  { id: 'curry', name: 'แกง' },
  { id: 'stir-fry', name: 'ผัด' },
  { id: 'fried', name: 'ของทอด / ต้ม' },
  { id: 'rice', name: 'ข้าวเปล่า' },
  { id: 'drink', name: 'เครื่องดื่ม' }
]

// Filtered Menu Items
const filteredMenu = computed(() => {
  if (activeCategory.value === 'all') return pos.menuItems
  return pos.menuItems.filter(item => item.category === activeCategory.value)
})

// Serving Option Selector
const selectedOption = ref('normal') // normal (กับข้าว), rad-khao-1 (ราดข้าว 1 อย่าง), rad-khao-2 (ราดข้าว 2 อย่าง)

// Payment Modal State
const isPaymentModalOpen = ref(false)
const amountPaid = ref('')
const paymentMethod = ref('cash') // 'cash' or 'qr'
const isPaidSuccess = ref(false)

const changeAmount = computed(() => {
  const paid = parseFloat(amountPaid.value) || 0
  return Math.max(0, paid - pos.total)
})

const openPayment = () => {
  if (pos.cart.length === 0) return
  amountPaid.value = ''
  isPaidSuccess.value = false
  isPaymentModalOpen.value = true
}

const processPayment = () => {
  if (paymentMethod.value === 'cash' && (parseFloat(amountPaid.value) || 0) < pos.total) {
    alert('จำนวนเงินที่รับมาไม่เพียงพอ')
    return
  }
  isPaidSuccess.value = true
}

const completeOrder = () => {
  pos.clearCart()
  isPaymentModalOpen.value = false
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-100 overflow-hidden">
    <!-- Left Panel: Menu Items Grid -->
    <div class="flex-grow flex flex-col p-4 md:p-6 overflow-hidden h-full">
      <!-- Top Bar: Shop Header & Category Selector -->
      <div class="mb-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-800">เครื่องสั่งอาหาร - ร้านข้าวราดแกง</h1>
          <p class="text-xs text-slate-500">แคชเชียร์: {{ auth.user?.name || 'พนักงาน' }} ({{ auth.user?.role || 'แคชเชียร์' }})</p>
        </div>
        
        <!-- Serve Option Switcher -->
        <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button 
            @click="selectedOption = 'normal'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              selectedOption === 'normal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            ]"
          >
            กับข้าวปกติ
          </button>
          <button 
            @click="selectedOption = 'rad-khao-1'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              selectedOption === 'rad-khao-1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            ]"
          >
            ราดข้าว 1 อย่าง
          </button>
          <button 
            @click="selectedOption = 'rad-khao-2'"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
              selectedOption === 'rad-khao-2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            ]"
          >
            ราดข้าว 2 อย่าง
          </button>
        </div>
      </div>

      <!-- Categories Filter Tabs -->
      <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        <button 
          v-for="cat in categories" 
          :key="cat.id"
          @click="activeCategory = cat.id"
          :class="[
            'px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border',
            activeCategory === cat.id 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100' 
              : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-50'
          ]"
        >
          {{ cat.name }}
        </button>
      </div>

      <!-- Menu Grid -->
      <div class="flex-grow overflow-y-auto mt-2 pr-1">
        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          <button 
            v-for="item in filteredMenu" 
            :key="item.id"
            @click="pos.addToCart(item, selectedOption)"
            class="group bg-white rounded-2xl p-4 text-left border border-slate-200/60 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between h-36 relative overflow-hidden active:scale-95"
          >
            <!-- Decorative colored corner -->
            <div :class="['absolute top-0 right-0 w-8 h-8 rounded-bl-full bg-gradient-to-tr opacity-20', item.color]"></div>
            
            <div class="z-10">
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {{ categories.find(c => c.id === item.category)?.name }}
              </span>
              <h3 class="font-bold text-slate-800 mt-1 line-clamp-2 text-sm sm:text-base leading-tight group-hover:text-indigo-600 transition-colors">
                {{ item.name }}
              </h3>
            </div>
            
            <div class="flex justify-between items-baseline z-10 mt-auto">
              <span class="text-lg font-extrabold text-slate-900">
                ฿{{ item.price }}
              </span>
              <span class="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                เลือก +
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Right Panel: Cart/Order Sidebar -->
    <div class="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 shadow-xl flex flex-col h-full overflow-hidden shrink-0">
      <!-- Order Title -->
      <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span class="font-bold text-slate-800">รายการสั่งซื้อ</span>
        </div>
        <button 
          v-if="pos.cart.length > 0"
          @click="pos.clearCart" 
          class="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all"
        >
          ล้างตะกร้า
        </button>
      </div>

      <!-- Cart Items List -->
      <div class="flex-grow overflow-y-auto p-4 space-y-3">
        <div 
          v-if="pos.cart.length === 0" 
          class="h-full flex flex-col items-center justify-center text-slate-400 py-12"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 stroke-current mb-3 opacity-60" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="text-sm font-semibold">ยังไม่มีรายการสินค้าที่เลือก</p>
          <p class="text-xs text-slate-400 mt-1">กดคลิกรายการอาหารเพื่อเพิ่มลงตะกร้า</p>
        </div>

        <div 
          v-for="(item, index) in pos.cart" 
          :key="index"
          class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all gap-2"
        >
          <div class="flex-grow min-w-0">
            <h4 class="font-bold text-slate-800 text-sm truncate">{{ item.displayName }}</h4>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-slate-400">฿{{ item.price }}</span>
              <span v-if="item.option !== 'normal'" class="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-semibold">
                {{ item.option === 'rad-khao-1' ? 'ราดข้าว 1' : 'ราดข้าว 2' }}
              </span>
            </div>
          </div>
          
          <!-- Quantity Controls -->
          <div class="flex items-center gap-2.5 bg-white border border-slate-200 rounded-lg p-1">
            <button 
              @click="pos.updateQuantity(index, -1)" 
              class="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-sm active:scale-90"
            >
              -
            </button>
            <span class="text-xs font-bold text-slate-800 w-4 text-center">{{ item.quantity }}</span>
            <button 
              @click="pos.updateQuantity(index, 1)" 
              class="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-sm active:scale-90"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- Pricing Summary -->
      <div class="p-4 border-t border-slate-200 bg-slate-50/50 space-y-3">
        <div class="flex justify-between text-sm text-slate-500 font-medium">
          <span>รวมเป็นเงิน</span>
          <span>฿{{ pos.subtotal }}</span>
        </div>
        
        <div class="flex justify-between items-center text-sm text-slate-500 font-medium">
          <span>ส่วนลด (บาท)</span>
          <input 
            type="number" 
            v-model.number="pos.discount" 
            min="0"
            class="w-20 px-2 py-1 text-right text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="0"
          />
        </div>

        <div class="flex justify-between text-base font-extrabold text-slate-800 border-t border-dashed border-slate-200 pt-3">
          <span>ยอดชำระเงิน</span>
          <span class="text-indigo-600 text-xl">฿{{ pos.total }}</span>
        </div>

        <!-- Checkout Trigger Button -->
        <button 
          @click="openPayment"
          :disabled="pos.cart.length === 0"
          class="w-full mt-2 inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-98"
        >
          ชำระเงิน
        </button>
      </div>
    </div>

    <!-- Payment Modal -->
    <div v-if="isPaymentModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-fade-in">
        <!-- Modal Header -->
        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 text-lg">ขั้นตอนการชำระเงิน</h3>
          <button @click="isPaymentModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="!isPaidSuccess" class="p-6 space-y-6">
          <div class="text-center">
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">ยอดเงินที่ต้องชำระทั้งหมด</p>
            <p class="text-4xl font-extrabold text-indigo-600 mt-1">฿{{ pos.total }}</p>
          </div>

          <!-- Payment Method Tabs -->
          <div class="grid grid-cols-2 gap-3">
            <button 
              @click="paymentMethod = 'cash'"
              :class="[
                'py-3 rounded-xl font-bold border transition-all text-sm flex flex-col items-center gap-1',
                paymentMethod === 'cash' ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              ]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>เงินสด</span>
            </button>
            <button 
              @click="paymentMethod = 'qr'"
              :class="[
                'py-3 rounded-xl font-bold border transition-all text-sm flex flex-col items-center gap-1',
                paymentMethod === 'qr' ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              ]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 16h.01M9 16h.01M9 12h.01M9 8h.01M12 16h.01M16 8h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>สแกน QR Code</span>
            </button>
          </div>

          <!-- Cash Payment Interface -->
          <div v-if="paymentMethod === 'cash'" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700">รับเงินมา (บาท)</label>
              <input 
                type="number" 
                v-model="amountPaid"
                placeholder="ระบุจำนวนเงินที่รับ"
                class="w-full mt-1.5 px-4 py-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-extrabold text-lg"
              />
            </div>
            
            <!-- Quick Cash Buttons -->
            <div class="grid grid-cols-4 gap-2">
              <button 
                v-for="val in [50, 100, 500, 1000]"
                :key="val"
                @click="amountPaid = val"
                class="py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 rounded-lg transition-all"
              >
                ฿{{ val }}
              </button>
            </div>

            <!-- Change Preview -->
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
              <span class="text-sm text-slate-600 font-semibold">เงินทอน</span>
              <span class="text-xl font-extrabold text-indigo-600">฿{{ changeAmount }}</span>
            </div>
          </div>

          <!-- QR Payment Interface -->
          <div v-else class="flex flex-col items-center py-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <!-- Mock PromptPay Logo -->
            <div class="px-3 py-1.5 bg-blue-900 text-white rounded font-extrabold text-xs tracking-wider mb-3">
              PROMPT PAY
            </div>
            <!-- Mock QR Image -->
            <div class="bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-36 w-36 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 16h.01M9 16h.01M9 12h.01M9 8h.01M12 16h.01M16 8h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p class="text-xs text-slate-500 mt-2 font-medium">สแกนชำระเงินมูลค่า ฿{{ pos.total }}</p>
          </div>

          <!-- Submit Payment -->
          <button 
            @click="processPayment"
            class="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
          >
            ยืนยันการรับเงิน
          </button>
        </div>

        <!-- Payment Success View -->
        <div v-else class="p-8 text-center space-y-6">
          <div class="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 class="text-xl font-bold text-slate-800">ชำระเงินสำเร็จ!</h4>
            <p class="text-sm text-slate-500 mt-1">บันทึกรายการคำสั่งซื้อเรียบร้อยแล้ว</p>
          </div>
          <div v-if="paymentMethod === 'cash'" class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-left">
            <div class="flex justify-between text-xs text-slate-500">
              <span>ยอดชำระ:</span>
              <span class="font-bold text-slate-800">฿{{ pos.total }}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>รับเงินมา:</span>
              <span class="font-bold text-slate-800">฿{{ amountPaid }}</span>
            </div>
            <div class="flex justify-between text-sm text-indigo-600 border-t border-dashed border-slate-200 mt-2 pt-2 font-bold">
              <span>เงินทอน:</span>
              <span>฿{{ changeAmount }}</span>
            </div>
          </div>
          <button 
            @click="completeOrder"
            class="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all"
          >
            ทำรายการถัดไป
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scrolled tab bar hiding */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out forwards;
}
</style>
