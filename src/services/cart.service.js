import api from "./api"

// Səbət yalnız serverdə saxlanılır (əvvəlki "lokal səbət" uydurma məhsullar üçün idi)
const LEGACY_LOCAL_CART_KEY = "shafransa_local_cart"
try {
  localStorage.removeItem(LEGACY_LOCAL_CART_KEY)
} catch {
  // yaddaşa çıxış yoxdursa, silinəcək bir şey də yoxdur
}

export const getCart = async () => {
  const cart = await api.get("/cart")
  const data = cart?.data || cart || {}
  return { ...data, items: Array.isArray(data.items) ? data.items : [] }
}

export const addToCart = async (productId, quantity) => await api.post("/cart/add", { productId, quantity })

export const updateCartItem = async (id, quantity) => await api.put(`/cart/${id}`, { quantity })

export const removeFromCart = async (id) => await api.delete(`/cart/${id}`)
