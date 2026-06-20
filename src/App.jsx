import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/auth/ProtectedRoute'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import AccountPage from './pages/AccountPage'
import AdminPage from './pages/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/auth" element={
                <GuestRoute><AuthPage /></GuestRoute>
              } />

              {/* Protected user routes */}
              <Route path="/" element={
                <ProtectedRoute><HomePage /></ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute><CartPage /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute><OrdersPage /></ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute><AccountPage /></ProtectedRoute>
              } />

              {/* Admin */}
              <Route path="/admin" element={
                <AdminRoute><AdminPage /></AdminRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
