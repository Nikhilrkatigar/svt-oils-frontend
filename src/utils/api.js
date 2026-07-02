import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
})

// Attach token on every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('svt_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const authApi = {
  login: (data) => API.post('/auth/login', data),
  register: (data) => API.post('/auth/register', data),
  me: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
}

const cacheStore = {
  products: null,
  settings: null,
}

// Products
export const productApi = {
  getAll: async (params, bypassCache = false) => {
    const isDefaultQuery = !params || (Object.keys(params).length === 1 && params.limit === 100) || Object.keys(params).length === 0
    if (isDefaultQuery && cacheStore.products && !bypassCache) {
      return { data: { products: cacheStore.products } }
    }
    const res = await API.get('/products', { params })
    if (isDefaultQuery) {
      cacheStore.products = res.data.products
    }
    return res
  },
  getSuggested: () => API.get('/products/suggested'),
  getOne: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories'),
  // Admin only
  create: async (data) => {
    cacheStore.products = null
    return API.post('/products', data)
  },
  uploadImage: (data) => API.post('/products/upload-image', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: async (id, data) => {
    cacheStore.products = null
    return API.put(`/products/${id}`, data)
  },
  delete: async (id) => {
    cacheStore.products = null
    return API.delete(`/products/${id}`)
  },
  clearCache: () => {
    cacheStore.products = null
  },
}

// Orders
export const orderApi = {
  place: (data) => API.post('/orders', data),
  myOrders: (params) => API.get('/orders/my', { params }),
  getOne: (id) => API.get(`/orders/${id}`),
  cancel: (id) => API.patch(`/orders/${id}/cancel`),
  // Admin only
  all: (params) => API.get('/orders/admin/all', { params }),
  updateStatus: (id, status) => API.patch(`/orders/${id}/status`, { status }),
  delete: (id) => API.delete(`/orders/${id}`),
  exportAll: () => API.get('/orders/admin/export', { responseType: 'text' }),
}

// Location
export const locationApi = {
  reverse: (params) => API.get('/location/reverse', { params }),
}

// Admin
export const adminApi = {
  dashboard: () => API.get('/admin/dashboard'),
  visitors: (params) => API.get('/admin/visitors', { params }),
  users: (params) => API.get('/admin/users', { params }),
  userDetail: (id) => API.get(`/admin/users/${id}`),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  toggleBlockUser: (id) => API.patch(`/admin/users/${id}/block`),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
}

// Settings
export const settingsApi = {
  get: async (bypassCache = false) => {
    if (cacheStore.settings && !bypassCache) {
      return { data: cacheStore.settings }
    }
    const res = await API.get('/settings')
    cacheStore.settings = res.data
    return res
  },
  update: async (data) => {
    cacheStore.settings = null
    return API.put('/settings', data)
  },
  clearCache: () => {
    cacheStore.settings = null
  },
}

export default API
