import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePosStore = defineStore('pos', () => {
  const menuItems = ref([
    { id: 1, name: 'แกงเขียวหวานไก่', price: 50, category: 'curry', color: 'from-emerald-400 to-green-500' },
    { id: 2, name: 'พะแนงหมู', price: 50, category: 'curry', color: 'from-orange-400 to-red-500' },
    { id: 3, name: 'ไข่พะโล้', price: 45, category: 'curry', color: 'from-amber-500 to-amber-700' },
    { id: 4, name: 'แกงส้มชะอมไข่', price: 55, category: 'curry', color: 'from-yellow-500 to-orange-600' },
    { id: 16, name: 'ต้มหมึกหวาน', price: 70, ricePlatePrice: 60, isPremium: true, category: 'curry', color: 'from-violet-400 to-fuchsia-600' },
    
    { id: 5, name: 'กะเพราหมูสับ', price: 45, category: 'stir-fry', color: 'from-red-400 to-rose-600' },
    { id: 6, name: 'ผัดผักรวมมิตร', price: 40, category: 'stir-fry', color: 'from-green-400 to-emerald-600' },
    { id: 7, name: 'ผัดเผ็ดปลาดุก', price: 50, category: 'stir-fry', color: 'from-red-500 to-amber-800' },
    { id: 17, name: 'หมูคั่วเค็ม', price: 65, ricePlatePrice: 60, isPremium: true, category: 'stir-fry', color: 'from-stone-500 to-amber-700' },
    
    { id: 8, name: 'หมูทอดกระเทียม', price: 45, category: 'fried', color: 'from-amber-400 to-amber-600' },
    { id: 9, name: 'ไข่ดาว', price: 10, category: 'fried', color: 'from-yellow-300 to-orange-400' },
    { id: 10, name: 'ไข่เจียว', price: 15, category: 'fried', color: 'from-amber-300 to-yellow-500' },
    { id: 11, name: 'กุนเชียงทอด', price: 15, category: 'fried', color: 'from-rose-400 to-red-500' },
    
    { id: 12, name: 'ข้าวสวย', price: 10, category: 'rice', color: 'from-slate-200 to-slate-300 text-gray-800' },
    { id: 13, name: 'น้ำเปล่า', price: 10, category: 'drink', color: 'from-blue-300 to-sky-500' },
    { id: 14, name: 'น้ำอัดลม', price: 15, category: 'drink', color: 'from-red-500 to-red-700' },
    { id: 15, name: 'โอเลี้ยง / ชาดำเย็น', price: 20, category: 'drink', color: 'from-yellow-850 to-amber-950' }
  ])

  const cart = ref([])
  const discount = ref(0) // percentage or absolute (we'll use THB absolute discount)
  const orderType = ref('dine-in')
  const selectedTable = ref('')
  const tables = ref(Array.from({ length: 12 }, (_, index) => index + 1))
  const heldOrders = ref([])

  const subtotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  })

  const total = computed(() => {
    const calculated = subtotal.value - discount.value
    return calculated < 0 ? 0 : calculated
  })

  function resetOrder() {
    cart.value = []
    discount.value = 0
    orderType.value = 'dine-in'
    selectedTable.value = ''
  }

  function addToCart(product, option = 'normal') {
    // Check if item already exists in cart with same option
    const existingIndex = cart.value.findIndex(
      item => item.id === product.id && item.option === option
    )

    if (existingIndex > -1) {
      cart.value[existingIndex].quantity++
    } else {
      let displayName = product.name
      let finalPrice = product.price

      // Rice and Curry shop customizations
      if (option === 'rad-khao-1') {
        displayName = `ราดข้าว 1 อย่าง (${product.name})`
        finalPrice = 40 // Standard single topping price
      } else if (option === 'rad-khao-2') {
        displayName = `ราดข้าว 2 อย่าง (${product.name})`
        finalPrice = 50 // Standard double topping price
      }

      cart.value.push({
        ...product,
        displayName,
        price: finalPrice,
        option,
        quantity: 1
      })
    }
  }

  function addRicePlateToCart(plate) {
    const toppingNames = plate.toppings.map(item => item.name).join(' + ')
    const displayName = `${plate.isSpecial ? 'ราดข้าวพิเศษ' : 'ราดข้าว'} ${plate.toppingCount} อย่าง (${toppingNames})`
    const option = `rice-plate-${plate.toppingCount}${plate.isSpecial ? '-special' : ''}`
    const signature = plate.toppings.map(item => item.id).sort((a, b) => a - b).join('-')

    const existingIndex = cart.value.findIndex(
      item => item.option === option && item.signature === signature && item.price === plate.price
    )

    if (existingIndex > -1) {
      cart.value[existingIndex].quantity++
      return
    }

    cart.value.push({
      id: `rice-plate-${Date.now()}`,
      displayName,
      name: displayName,
      price: plate.price,
      option,
      signature,
      toppingCount: plate.toppingCount,
      toppings: plate.toppings.map(item => ({ ...item })),
      isSpecial: plate.isSpecial,
      note: plate.note,
      quantity: 1
    })
  }

  function removeFromCart(index) {
    cart.value.splice(index, 1)
  }

  function updateQuantity(index, change) {
    const item = cart.value[index]
    item.quantity += change
    if (item.quantity <= 0) {
      removeFromCart(index)
    }
  }

  function clearCart() {
    cart.value = []
    discount.value = 0
  }

  function holdCurrentOrder() {
    if (cart.value.length === 0 || orderType.value !== 'dine-in' || !selectedTable.value) return false

    const order = {
      id: `table-${selectedTable.value}`,
      table: selectedTable.value,
      cart: cart.value.map(item => ({ ...item })),
      discount: discount.value,
      subtotal: subtotal.value,
      total: total.value,
      itemCount: cart.value.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: new Date().toISOString()
    }

    const existingIndex = heldOrders.value.findIndex(item => item.table === selectedTable.value)
    if (existingIndex > -1) {
      heldOrders.value.splice(existingIndex, 1, order)
    } else {
      heldOrders.value.push(order)
    }

    resetOrder()
    return true
  }

  function loadHeldOrder(tableNumber) {
    const orderIndex = heldOrders.value.findIndex(item => item.table === tableNumber)
    if (orderIndex === -1) return false

    const order = heldOrders.value[orderIndex]
    cart.value = order.cart.map(item => ({ ...item }))
    discount.value = order.discount
    orderType.value = 'dine-in'
    selectedTable.value = order.table
    heldOrders.value.splice(orderIndex, 1)
    return true
  }

  function setOrderType(type) {
    orderType.value = type
    if (type === 'takeaway') {
      selectedTable.value = ''
    }
  }

  function setSelectedTable(tableNumber) {
    selectedTable.value = tableNumber
    orderType.value = 'dine-in'
  }

  return {
    menuItems,
    cart,
    discount,
    orderType,
    selectedTable,
    tables,
    heldOrders,
    subtotal,
    total,
    resetOrder,
    addToCart,
    addRicePlateToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    holdCurrentOrder,
    loadHeldOrder,
    setOrderType,
    setSelectedTable
  }
})
