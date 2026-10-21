import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import api from "@/services/api"

// Admin səhifələrinin paylaşdığı sorğular (eyni queryKey — sidebar badge və səhifələr eyni cache-i istifadə edir)
export const adminKeys = {
  health: ["admin", "health"],
  pendingTherapistRequests: ["admin", "therapist-requests", "pending"],
  users: ["admin", "users"],
  products: ["admin", "products"],
  categories: ["admin", "categories"],
  stats: (name) => ["admin", "stats", name],
}

export function useAdminUsers(options = {}) {
  return useQuery({
    queryKey: adminKeys.users,
    queryFn: async () => {
      const data = await api.get("/user")
      return Array.isArray(data) ? data : []
    },
    ...options,
  })
}

// Status/rol dəyişikliyi: cavabdakı yenilənmiş istifadəçi cache-də dərhal əvəz olunur (siyahı yenidən yüklənmir)
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, value }) =>
      action === "status"
        ? api.put(`/user/${id}/status`, { isActive: value })
        : api.put(`/user/${id}/role`, { role: value }),
    onSuccess: (updated) => {
      queryClient.setQueryData(adminKeys.users, (users) =>
        Array.isArray(users) ? users.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)) : users
      )
    },
  })
}

// Redaktə paneli üçün tək istifadəçi (təsvir və əlaqəli datanın sayları ilə)
export const userKeys = { detail: (id) => ["admin", "user", id] }

export function useAdminUser(id, options = {}) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => api.get(`/user/${id}`),
    enabled: !!id,
    staleTime: 0,
    ...options,
  })
}

const USER_LIST_FIELDS = ["fullName", "email", "avatar", "isEmailVerified", "isActive", "role"]

export function useSaveUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }) => api.put(`/user/${id}`, form),
    onSuccess: (updated) => {
      const fields = Object.fromEntries(USER_LIST_FIELDS.map((k) => [k, updated[k]]))
      queryClient.setQueryData(adminKeys.users, (users) =>
        Array.isArray(users) ? users.map((u) => (u.id === updated.id ? { ...u, ...fields } : u)) : users
      )
      queryClient.setQueryData(userKeys.detail(updated.id), updated)
      // Terapevtin adı/emaili terapevt siyahılarında da görünür
      if (updated.therapistId) {
        queryClient.invalidateQueries({ queryKey: therapistKeys.all })
        queryClient.invalidateQueries({ queryKey: therapistKeys.detail(updated.therapistId) })
      }
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/user/${id}`),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(adminKeys.users, (users) => (Array.isArray(users) ? users.filter((u) => u.id !== id) : users))
      queryClient.removeQueries({ queryKey: userKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: adminKeys.users })
      queryClient.invalidateQueries({ queryKey: therapistKeys.all })
    },
  })
}

export function usePendingTherapistRequests(options = {}) {
  return useQuery({
    queryKey: adminKeys.pendingTherapistRequests,
    queryFn: async () => {
      const data = await api.get("/therapists/requests/pending")
      return Array.isArray(data) ? data : []
    },
    staleTime: 60_000,
    ...options,
  })
}

export function useAdminCategories(options = {}) {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: async () => {
      const data = await api.get("/categories")
      return Array.isArray(data) ? data : []
    },
    staleTime: 5 * 60_000,
    ...options,
  })
}

// Server tərəfində səhifələmə; yeni səhifə yüklənərkən köhnə sətirlər ekranda qalır (cədvəl "sıçramır")
export function useAdminProducts(params) {
  return useQuery({
    queryKey: [...adminKeys.products, params],
    queryFn: async () => {
      const data = await api.get("/products", { params })
      return { items: Array.isArray(data?.data) ? data.data : [], total: data?.pagination?.total ?? 0 }
    },
    placeholderData: keepPreviousData,
  })
}

function patchProductInLists(queryClient, id, fields) {
  queryClient.setQueriesData({ queryKey: adminKeys.products }, (list) =>
    list?.items ? { ...list, items: list.items.map((p) => (p.id === id ? { ...p, ...fields } : p)) } : list
  )
}

// PUT /products/{id} multipart qəbul edir; yalnız dəyişən sahələr göndərilir.
// Optimistik: UI dərhal dəyişir, xəta olsa əvvəlki vəziyyət bərpa olunur.
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fields }) => {
      const form = new FormData()
      Object.entries(fields).forEach(([key, value]) => form.append(key, String(value)))
      return api.put(`/products/${id}`, form)
    },
    onMutate: async ({ id, fields }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.products })
      const snapshot = queryClient.getQueriesData({ queryKey: adminKeys.products })
      patchProductInLists(queryClient, id, fields)
      return { snapshot }
    },
    onError: (_error, _vars, context) => {
      context?.snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.products }),
  })
}

// Redaktor üçün bütün dillərdəki tərcümələrlə tək məhsul (siyahı açarından ayrı — siyahı yenilənməsi formu pozmasın)
export const productKeys = { detail: (id) => ["admin", "product", id] }

export function useAdminProduct(id, options = {}) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => api.get(`/products/${id}`, { headers: { "Accept-Language": "az" } }),
    enabled: !!id,
    staleTime: 0,
    ...options,
  })
}

export function useSaveProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }) => (id ? api.put(`/products/${id}`, form) : api.post("/products", form)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("products") })
      queryClient.invalidateQueries({ queryKey: adminKeys.categories })
      if (id) queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.products })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("products") })
    },
  })
}

// Kateqoriya yarat/yenilə — multipart (ikon faylı ilə); uğurdan sonra siyahı və statistika yenilənir
export function useSaveCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }) => (id ? api.put(`/categories/${id}`, form) : api.post("/categories", form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("categories") })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.categories })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("categories") })
    },
  })
}

// ── Ensiklopediya (bitkilər) ──
export const plantKeys = {
  list: ["admin", "plants", "list"],
  detail: (id) => ["admin", "plants", "detail", id],
}

export function useAdminPlants(params, options = {}) {
  return useQuery({
    queryKey: [...plantKeys.list, params],
    queryFn: async () => {
      const data = await api.get("/plants/paginated", { params: { language: "az", ...params } })
      return { items: Array.isArray(data?.data) ? data.data : [], total: data?.pagination?.total ?? 0 }
    },
    placeholderData: keepPreviousData,
    ...options,
  })
}

export function useAdminPlant(id, options = {}) {
  return useQuery({
    queryKey: plantKeys.detail(id),
    queryFn: () => api.get(`/plants/${id}`, { headers: { "Accept-Language": "az" } }),
    enabled: !!id,
    staleTime: 0,
    ...options,
  })
}

export function useSavePlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }) => (id ? api.put(`/plants/${id}`, form) : api.post("/plants", form)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: plantKeys.list })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("plants") })
      if (id) queryClient.invalidateQueries({ queryKey: plantKeys.detail(id) })
    },
  })
}

export function useDeletePlant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/plants/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plantKeys.list })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("plants") })
    },
  })
}

// ── Terapevtlər ──
export const therapistKeys = {
  all: ["admin", "therapists"],
  processed: ["admin", "therapist-requests", "processed"],
  detail: (id) => ["admin", "therapist", id],
}

// Redaktor üçün tam profil (iş saatları ilə)
export function useAdminTherapist(id, options = {}) {
  return useQuery({
    queryKey: therapistKeys.detail(id),
    queryFn: () => api.get(`/therapists/${id}/admin`),
    enabled: !!id,
    staleTime: 0,
    ...options,
  })
}

export function useSaveTherapist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }) => api.put(`/therapists/${id}`, form),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: therapistKeys.all })
      queryClient.invalidateQueries({ queryKey: therapistKeys.processed })
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingTherapistRequests })
      queryClient.invalidateQueries({ queryKey: therapistKeys.detail(id) })
      invalidatePublicTherapists(queryClient)
    },
  })
}

export function useCreateTherapist() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.post("/therapists", data),
    onSuccess: () => invalidateTherapistData(queryClient),
  })
}

export function useProcessedTherapistRequests(options = {}) {
  return useQuery({
    queryKey: therapistKeys.processed,
    queryFn: async () => {
      const data = await api.get("/therapists/requests/processed")
      return Array.isArray(data) ? data : []
    },
    ...options,
  })
}

export function useAdminTherapists(options = {}) {
  return useQuery({
    queryKey: therapistKeys.all,
    queryFn: async () => {
      const data = await api.get("/therapists")
      return Array.isArray(data) ? data : []
    },
    ...options,
  })
}

function invalidateTherapistData(queryClient) {
  queryClient.invalidateQueries({ queryKey: adminKeys.pendingTherapistRequests })
  queryClient.invalidateQueries({ queryKey: therapistKeys.processed })
  queryClient.invalidateQueries({ queryKey: therapistKeys.all })
  invalidatePublicTherapists(queryClient)
}

// Saytın öz keşi (siyahı, ana səhifə, profil) — admin dəyişikliyi dərhal görünsün
function invalidatePublicTherapists(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["therapists", "verified"] })
  queryClient.invalidateQueries({ queryKey: ["landing", "therapists"] })
  queryClient.invalidateQueries({ queryKey: ["therapist"] })
}

// Təsdiq/rədd: sidebar badge-i, ümumi baxış və bütün siyahılar yenilənir
export function useReviewTherapistRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, action, reason }) =>
      action === "approve"
        ? api.post(`/therapists/requests/${requestId}/approve`)
        : api.post(`/therapists/requests/${requestId}/reject`, { reason }),
    onSettled: () => invalidateTherapistData(queryClient),
  })
}

// Saytda göstər/gizlət — optimistik
export function useUpdateTherapistMenuStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isShowMenu }) => api.put(`/therapists/${id}/menu-status`, { isShowMenu }),
    onMutate: async ({ id, isShowMenu }) => {
      await queryClient.cancelQueries({ queryKey: therapistKeys.all })
      const previous = queryClient.getQueryData(therapistKeys.all)
      queryClient.setQueryData(therapistKeys.all, (list) =>
        Array.isArray(list) ? list.map((t) => (t.id === id ? { ...t, isShowMenu } : t)) : list
      )
      return { previous }
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(therapistKeys.all, context?.previous),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: therapistKeys.all })
      invalidatePublicTherapists(queryClient)
    },
  })
}

// ── Bloglar ──
export const blogKeys = {
  list: ["admin", "blogs", "list"],
  detail: (id) => ["admin", "blogs", "detail", id],
}

// Saytın öz keşi (bloq siyahısı, ana səhifə, bloq səhifəsi)
function invalidatePublicBlogs(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["blogs"] })
  queryClient.invalidateQueries({ queryKey: ["landing", "blogs"] })
  queryClient.invalidateQueries({ queryKey: ["blog"] })
}

export function useAdminBlogs(params) {
  return useQuery({
    queryKey: [...blogKeys.list, params],
    queryFn: async () => {
      const data = await api.get("/blogs", { params, headers: { "Accept-Language": "az" } })
      return { items: Array.isArray(data?.data) ? data.data : [], total: data?.pagination?.total ?? 0 }
    },
    placeholderData: keepPreviousData,
  })
}

export function useAdminBlog(id, options = {}) {
  return useQuery({
    queryKey: blogKeys.detail(id),
    queryFn: () => api.get(`/blogs/${id}`, { headers: { "Accept-Language": "az" } }),
    enabled: !!id,
    staleTime: 0,
    ...options,
  })
}

export function useSaveBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, form }) => (id ? api.put(`/blogs/${id}`, form) : api.post("/blogs", form)),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.list })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("blogs") })
      if (id) queryClient.invalidateQueries({ queryKey: blogKeys.detail(id) })
      invalidatePublicBlogs(queryClient)
    },
  })
}

export function useDeleteBlog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => api.delete(`/blogs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.list })
      queryClient.invalidateQueries({ queryKey: adminKeys.stats("blogs") })
      invalidatePublicBlogs(queryClient)
    },
  })
}

// ── Seanslar ──
export const sessionKeys = { list: ["admin", "sessions", "list"] }

export function useAdminSessions(params) {
  return useQuery({
    queryKey: [...sessionKeys.list, params],
    queryFn: async () => {
      const data = await api.get("/therapy-sessions/admin", { params })
      return {
        items: Array.isArray(data?.data) ? data.data : [],
        total: data?.pagination?.total ?? 0,
        counts: data?.counts ?? null,
      }
    },
    placeholderData: keepPreviousData,
  })
}

export function useAdminCancelSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => api.post(`/therapy-sessions/${id}/admin-cancel`, { reason }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: sessionKeys.list }),
  })
}
