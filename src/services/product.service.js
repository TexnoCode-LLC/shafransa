import api from "./api"
import { useAuthStore } from "../store/useAuthStore"
// Yalnız real API datası (əvvəl mockData-dakı uydurma məhsullar siyahıya qarışdırılırdı)
const normalizeProductsResponse = (response) => {
  if (Array.isArray(response)) {
    return { data: response, pagination: { total: response.length, page: 1, pages: 1 } }
  }
  return {
    data: Array.isArray(response?.data) ? response.data : [],
    pagination: response?.pagination || { total: 0, page: 1, pages: 0 },
  }
}

export const getProducts = async (params = {}) => normalizeProductsResponse(await api.get("/products", { params }))

export const getProductById = async (id) => await api.get(`/products/${id}`)

export const getMyProducts = async () => {
  // Yalnız daxil olmuş satıcının öz məhsulları (əvvəl bütün məhsullar gəlirdi)
  const sellerId = useAuthStore.getState().user?.id
  if (!sellerId) return []
  return await api.get("/products", { params: { sellerId, limit: 100 } })
}

export const getSellerProducts = async (sellerId) => {
  // Backend satıcıya görə süzür (sellerId); bir sorğuda maksimum 100 məhsul qaytarılır
  return await api.get("/products", { params: { sellerId, limit: 100 } })
}

export const createProduct = async (data) => {
  return await api.post("/products", data)
}

export const updateProduct = async (id, data) => {
  return await api.put(`/products/${id}`, data)
}

export const deleteProduct = async (id) => {
  return await api.delete(`/products/${id}`)
}
