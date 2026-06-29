import { lazy, Suspense } from 'react'
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

const AdminPage = lazy(() => import('./pages/AdminPage'))

const LoadingFallback = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: '#FFFBF0', fontFamily: "'Baloo 2', sans-serif" }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: '48px', height: '48px', border: '5px solid #FED7AA', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
      <div style={{ color: '#D97706', fontWeight: 800, fontSize: '1.2rem' }}>Loading Admin Panel...</div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  </div>
)

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
                <AdminRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminPage />
                  </Suspense>
                </AdminRoute>
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
