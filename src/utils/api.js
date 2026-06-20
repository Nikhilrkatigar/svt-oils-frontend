import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
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

// Products
export const productApi = {
  getAll: (params) => API.get('/products', { params }),
  getSuggested: () => API.get('/products/suggested'),
  getOne: (id) => API.get(`/products/${id}`),
  getCategories: () => API.get('/products/categories'),
  // Admin only
  create: (data) => API.post('/products', data),
  uploadImage: (data) => API.post('/products/upload-image', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, data) => API.put(`/products/${id}`, data),
  delete: (id) => API.delete(`/products/${id}`),
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
}

// Location
export const locationApi = {
  reverse: (params) => API.get('/location/reverse', { params }),
}

// Admin
export const adminApi = {
  dashboard: () => API.get('/admin/dashboard'),
  users: (params) => API.get('/admin/users', { params }),
  userDetail: (id) => API.get(`/admin/users/${id}`),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  toggleBlockUser: (id) => API.patch(`/admin/users/${id}/block`),
}

export default API
