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

// Mobile Tab State
const activeTab = ref('menu') // 'menu' or 'cart'

const cartQuantity = computed(() => {
  return pos.cart.reduce((sum, item) => sum + item.quantity, 0)
})

// Filtered Menu Items
const filteredMenu = computed(() => {
  if (activeCategory.value === 'all') return pos.menuItems
  return pos.menuItems.filter(item => item.category === activeCategory.value)
})

// Serving Option Selector
const selectedOption = ref('normal') // normal (กับข้าว), rad-khao-1 (ราดข้าว 1 อย่าง), rad-khao-2 (ราดข้าว 2 อย่าง)
const isRicePlateModalOpen = ref(false)
const ricePlateCount = ref(1)
const ricePlateSpecial = ref(false)
const ricePlateCustomPrice = ref(40)
const ricePlateNote = ref('')
const selectedRiceToppings = ref([])

const ricePlateMenu = computed(() => {
  return pos.menuItems.filter(item => !['rice', 'drink'].includes(item.category))
})

const suggestedRicePlatePrice = computed(() => {
  const basePrice = ricePlateCount.value === 1 ? 40 : 50
  const premiumPrice = selectedRiceToppings.value.reduce((highest, item) => {
    return Math.max(highest, item.ricePlatePrice || 0)
  }, 0)
  const specialExtra = ricePlateSpecial.value ? 10 : 0

  return Math.max(basePrice, premiumPrice) + specialExtra
})

// Payment Modal State
const isPaymentModalOpen = ref(false)
const isTableModalOpen = ref(false)
const amountPaid = ref('')
const paymentMethod = ref('cash') // 'cash' or 'qr'
const isPaidSuccess = ref(false)

const changeAmount = computed(() => {
  const paid = parseFloat(amountPaid.value) || 0
  return Math.max(0, paid - pos.total)
})

const syncRicePlatePrice = () => {
  ricePlateCustomPrice.value = suggestedRicePlatePrice.value
}

const openRicePlateBuilder = (item) => {
  ricePlateCount.value = selectedOption.value === 'rad-khao-2' ? 2 : 1
  ricePlateSpecial.value = false
  ricePlateNote.value = ''
  selectedRiceToppings.value = [item]
  syncRicePlatePrice()
  isRicePlateModalOpen.value = true
}

const handleMenuSelect = (item) => {
  if (selectedOption.value === 'normal') {
    pos.addToCart(item, selectedOption.value)
    return
  }

  openRicePlateBuilder(item)
}

const setRicePlateCount = (count) => {
  ricePlateCount.value = count
  selectedRiceToppings.value = selectedRiceToppings.value.slice(0, count)
  syncRicePlatePrice()
}

const toggleRicePlateTopping = (item) => {
  const existingIndex = selectedRiceToppings.value.findIndex(topping => topping.id === item.id)

  if (existingIndex > -1) {
    selectedRiceToppings.value.splice(existingIndex, 1)
    syncRicePlatePrice()
    return
  }

  if (selectedRiceToppings.value.length >= ricePlateCount.value) {
    selectedRiceToppings.value.splice(ricePlateCount.value - 1, 1, item)
  } else {
    selectedRiceToppings.value.push(item)
  }

  syncRicePlatePrice()
}

const toggleRicePlateSpecial = () => {
  ricePlateSpecial.value = !ricePlateSpecial.value
  syncRicePlatePrice()
}

const addRicePlate = () => {
  if (selectedRiceToppings.value.length === 0) return

  pos.addRicePlateToCart({
    toppingCount: ricePlateCount.value,
    toppings: selectedRiceToppings.value,
    isSpecial: ricePlateSpecial.value,
    price: Number(ricePlateCustomPrice.value) || suggestedRicePlatePrice.value,
    note: ricePlateNote.value
  })
  isRicePlateModalOpen.value = false
}

const getCartOptionLabel = (item) => {
  if (item.option === 'rad-khao-1') return 'ราดข้าว 1'
  if (item.option === 'rad-khao-2') return 'ราดข้าว 2'
  if (item.option?.startsWith('rice-plate')) {
    return item.isSpecial ? `ราดข้าว ${item.toppingCount} อย่าง พิเศษ` : `ราดข้าว ${item.toppingCount} อย่าง`
  }
  return ''
}

const openPayment = () => {
  if (pos.cart.length === 0) return
  if (pos.orderType === 'dine-in' && !pos.selectedTable) {
    isTableModalOpen.value = true
    return
  }
  amountPaid.value = ''
  isPaidSuccess.value = false
  isPaymentModalOpen.value = true
}

const openTableSelector = () => {
  pos.setOrderType('dine-in')
  isTableModalOpen.value = true
}

const selectTable = (table) => {
  pos.setSelectedTable(table)
  isTableModalOpen.value = false
}

const holdOrder = () => {
  if (pos.orderType !== 'dine-in' || !pos.selectedTable) {
    isTableModalOpen.value = true
    return
  }

  if (pos.holdCurrentOrder()) {
    activeTab.value = 'menu'
  }
}

const loadHeldOrder = (table) => {
  pos.loadHeldOrder(table)
  activeTab.value = 'cart'
}

const processPayment = () => {
  if (paymentMethod.value === 'cash' && (parseFloat(amountPaid.value) || 0) < pos.total) {
    alert('จำนวนเงินที่รับมาไม่เพียงพอ')
    return
  }
  isPaidSuccess.value = true
}

const completeOrder = () => {
  pos.resetOrder()
  isPaymentModalOpen.value = false
}
</script>

<template>
  <div class="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden">
    <!-- Mobile Tab Switcher -->
    <div class="md:hidden flex bg-white border-b border-slate-200 p-2 gap-2 shrink-0">
      <button 
        @click="activeTab = 'menu'" 
        :class="[
          'flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all',
          activeTab === 'menu' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
        ]"
      >
        รายการอาหาร
      </button>
      <button 
        @click="activeTab = 'cart'" 
        :class="[
          'flex-1 py-2 text-center text-sm font-bold rounded-xl transition-all relative',
          activeTab === 'cart' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
        ]"
      >
        ตะกร้าสินค้า
        <span v-if="cartQuantity > 0" class="absolute top-1/2 -translate-y-1/2 right-4 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
          {{ cartQuantity }}
        </span>
      </button>
    </div>

    <!-- Main Workspace Container -->
    <div class="flex-grow flex flex-col md:flex-row overflow-hidden relative">
      <!-- Left Panel: Menu Items Grid -->
      <div :class="['flex-grow flex flex-col p-4 md:p-6 overflow-hidden h-full relative pb-20 md:pb-6', activeTab === 'menu' ? 'flex' : 'hidden md:flex']">
        <!-- Top Bar: Shop Header & Category Selector -->
        <div class="mb-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-xl font-bold text-slate-800">เครื่องสั่งอาหาร - ร้านข้าวราดแกง</h1>
            <p class="text-xs text-slate-500">แคชเชียร์: {{ auth.user?.name || 'พนักงาน' }} ({{ auth.user?.role || 'แคชเชียร์' }})</p>
          </div>
          
          <!-- Serve Option Switcher -->
          <div class="flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
            <button 
              @click="selectedOption = 'normal'"
              :class="[
                'flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center',
                selectedOption === 'normal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              ]"
            >
              กับข้าวปกติ
            </button>
            <button 
              @click="selectedOption = 'rad-khao-1'"
              :class="[
                'flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center',
                selectedOption === 'rad-khao-1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              ]"
            >
              ราดข้าว 1
            </button>
            <button 
              @click="selectedOption = 'rad-khao-2'"
              :class="[
                'flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center',
                selectedOption === 'rad-khao-2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              ]"
            >
              ราดข้าว 2
            </button>
          </div>
        </div>

        <!-- Categories Filter Tabs -->
        <div class="flex gap-2 overflow-x-auto pb-3 scrollbar-hide shrink-0">
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
              @click="handleMenuSelect(item)"
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
                <span v-if="item.isPremium" class="inline-flex mt-2 text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-bold">
                  เมนูพิเศษ
                </span>
              </div>
              
              <div class="flex justify-between items-baseline z-10 mt-auto">
                <span class="text-lg font-extrabold text-slate-900">
                  ฿{{ selectedOption === 'normal' ? item.price : (item.ricePlatePrice || item.price) }}
                </span>
                <span class="text-xs text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  เลือก +
                </span>
              </div>
            </button>
          </div>
        </div>

        <!-- Floating bottom cart button for mobile -->
        <div v-if="pos.cart.length > 0" class="md:hidden absolute bottom-4 left-4 right-4 z-30">
          <button 
            @click="activeTab = 'cart'" 
            class="w-full bg-indigo-600 text-white py-3 px-5 rounded-xl shadow-xl font-bold flex justify-between items-center active:scale-95 transition-transform"
          >
            <span class="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>ดูตะกร้า ({{ cartQuantity }} รายการ)</span>
            </span>
            <span class="text-lg font-extrabold">฿{{ pos.total }}</span>
          </button>
        </div>
      </div>

      <!-- Right Panel: Cart/Order Sidebar -->
      <div :class="['w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 shadow-xl flex flex-col h-full overflow-hidden shrink-0', activeTab === 'cart' ? 'flex' : 'hidden md:flex']">
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

      <!-- Dining Type Selector -->
      <div class="p-4 border-b border-slate-200 bg-white space-y-3">
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="openTableSelector"
            :class="[
              'py-2.5 px-3 rounded-xl border text-sm font-bold transition-all',
              pos.orderType === 'dine-in'
                ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            ]"
          >
            นั่งที่ร้าน
          </button>
          <button
            @click="pos.setOrderType('takeaway')"
            :class="[
              'py-2.5 px-3 rounded-xl border text-sm font-bold transition-all',
              pos.orderType === 'takeaway'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-600 shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            ]"
          >
            กลับบ้าน
          </button>
        </div>

        <div class="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
          <span class="text-xs font-semibold text-slate-500">ประเภทออเดอร์</span>
          <span class="text-sm font-extrabold text-slate-800">
            {{ pos.orderType === 'takeaway' ? 'กลับบ้าน' : (pos.selectedTable ? `นั่งที่ร้าน - โต๊ะ ${pos.selectedTable}` : 'นั่งที่ร้าน - ยังไม่เลือกโต๊ะ') }}
          </span>
        </div>
      </div>

      <!-- Held Table Orders -->
      <div v-if="pos.heldOrders.length > 0" class="p-4 border-b border-slate-200 bg-amber-50/60 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">บิลค้าง</span>
          <span class="text-xs font-semibold text-amber-700">{{ pos.heldOrders.length }} โต๊ะ</span>
        </div>

        <div class="space-y-2 max-h-40 overflow-y-auto pr-1">
          <button
            v-for="order in pos.heldOrders"
            :key="order.id"
            @click="loadHeldOrder(order.table)"
            class="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-left hover:border-amber-400 hover:bg-amber-50 transition-all"
          >
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-extrabold text-slate-800">โต๊ะ {{ order.table }}</p>
                <p class="text-xs text-slate-500">{{ order.itemCount }} รายการ</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-extrabold text-amber-700">฿{{ order.total }}</p>
                <p class="text-[10px] font-bold text-slate-400">เรียกบิล</p>
              </div>
            </div>
          </button>
        </div>
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
                {{ getCartOptionLabel(item) }}
              </span>
            </div>
            <p v-if="item.note" class="text-[10px] text-slate-400 mt-1 truncate">{{ item.note }}</p>
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

        <!-- Hold and Checkout Actions -->
        <button 
          @click="holdOrder"
          :disabled="pos.cart.length === 0"
          class="w-full mt-2 inline-flex justify-center items-center py-3 px-4 border border-amber-200 rounded-xl text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-98"
        >
          พักบิลโต๊ะนี้
        </button>

        <button 
          @click="openPayment"
          :disabled="pos.cart.length === 0"
          class="w-full mt-2 inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-98"
        >
          ชำระเงิน
        </button>
      </div>
    </div>
    </div>

    <!-- Rice Plate Builder Modal -->
    <div v-if="isRicePlateModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[92vh] overflow-hidden animate-fade-in flex flex-col">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="font-bold text-slate-800 text-lg">จัดจานราดข้าว</h3>
            <p class="text-xs text-slate-500 mt-0.5">เลือกแกง ปรับพิเศษ และแก้ราคาได้ตามหน้างาน</p>
          </div>
          <button @click="isRicePlateModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-4 overflow-y-auto">
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="count in [1, 2]"
              :key="count"
              @click="setRicePlateCount(count)"
              :class="[
                'py-3 rounded-xl border text-sm font-bold transition-all',
                ricePlateCount === count
                  ? 'bg-indigo-50 border-indigo-600 text-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              ]"
            >
              ราดข้าว {{ count }} อย่าง
            </button>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              v-for="item in ricePlateMenu"
              :key="item.id"
              @click="toggleRicePlateTopping(item)"
              :class="[
                'min-h-20 rounded-xl border p-3 text-left transition-all',
                selectedRiceToppings.some(topping => topping.id === item.id)
                  ? 'bg-indigo-50 border-indigo-600 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              ]"
            >
              <div class="flex items-start justify-between gap-2">
                <span class="text-sm font-bold text-slate-800 leading-tight">{{ item.name }}</span>
                <span v-if="item.isPremium" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold shrink-0">พิเศษ</span>
              </div>
              <p class="text-xs text-slate-400 mt-2">
                ราดข้าว {{ item.ricePlatePrice ? `฿${item.ricePlatePrice}` : 'ราคาปกติ' }}
              </p>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              @click="toggleRicePlateSpecial"
              :class="[
                'rounded-xl border px-4 py-3 text-left transition-all',
                ricePlateSpecial
                  ? 'bg-amber-50 border-amber-500 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              ]"
            >
              <span class="block text-sm font-extrabold">พิเศษ +10</span>
              <span class="block text-xs mt-0.5">ใช้กับจานที่ลูกค้าขอเพิ่มปริมาณ</span>
            </button>

            <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="flex justify-between text-xs text-slate-500 font-semibold">
                <span>ราคาแนะนำ</span>
                <span>฿{{ suggestedRicePlatePrice }}</span>
              </div>
              <label class="block text-sm font-extrabold text-slate-800 mt-2">ราคาขายจริง</label>
              <input
                v-model.number="ricePlateCustomPrice"
                type="number"
                min="0"
                class="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg text-right text-lg font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-700">หมายเหตุ</label>
            <input
              v-model="ricePlateNote"
              type="text"
              placeholder="เช่น ข้าวน้อย, ราดน้ำเยอะ"
              class="w-full mt-1.5 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div class="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
            <div class="flex justify-between gap-3">
              <span class="text-sm font-semibold text-slate-600">จานนี้</span>
              <span class="text-sm font-extrabold text-indigo-700 text-right">
                {{ selectedRiceToppings.map(item => item.name).join(' + ') || 'ยังไม่ได้เลือกแกง' }}
              </span>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-slate-200 bg-white">
          <button
            @click="addRicePlate"
            :disabled="selectedRiceToppings.length === 0"
            class="w-full py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            เพิ่มจานนี้ ฿{{ ricePlateCustomPrice || suggestedRicePlatePrice }}
          </button>
        </div>
      </div>
    </div>

    <!-- Table Selection Modal -->
    <div v-if="isTableModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-fade-in">
        <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h3 class="font-bold text-slate-800 text-lg">เลือกโต๊ะนั่งทาน</h3>
            <p class="text-xs text-slate-500 mt-0.5">แตะหมายเลขโต๊ะที่ลูกค้าต้องการนั่ง</p>
          </div>
          <button @click="isTableModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 space-y-4">
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
            <button
              v-for="table in pos.tables"
              :key="table"
              @click="selectTable(table)"
              :class="[
                'h-16 rounded-xl border text-base font-extrabold transition-all flex flex-col items-center justify-center',
                pos.selectedTable === table
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600'
              ]"
            >
              <span class="text-[10px] font-bold opacity-70">โต๊ะ</span>
              <span>{{ table }}</span>
            </button>
          </div>

          <div class="flex items-center justify-between rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3">
            <span class="text-sm font-semibold text-slate-600">โต๊ะที่เลือก</span>
            <span class="text-base font-extrabold text-indigo-600">
              {{ pos.selectedTable ? `โต๊ะ ${pos.selectedTable}` : 'ยังไม่ได้เลือก' }}
            </span>
          </div>
        </div>
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
          <div class="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-left">
            <div class="flex justify-between text-xs text-slate-500">
              <span>ประเภทออเดอร์:</span>
              <span class="font-bold text-slate-800">
                {{ pos.orderType === 'takeaway' ? 'กลับบ้าน' : 'นั่งที่ร้าน' }}
              </span>
            </div>
            <div v-if="pos.orderType === 'dine-in'" class="flex justify-between text-xs text-slate-500 mt-1">
              <span>โต๊ะ:</span>
              <span class="font-bold text-slate-800">{{ pos.selectedTable }}</span>
            </div>
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
