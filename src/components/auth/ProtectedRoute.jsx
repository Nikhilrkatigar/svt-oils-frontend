import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🫙</div>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  )
  if (!user) return <Navigate to="/auth" replace />
  if (user.isAdmin) return <Navigate to="/admin" replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" />
  if (!user) return <Navigate to="/auth" replace />
  if (!user.isAdmin) return <Navigate to="/" replace />
  return children
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="spinner" />
  if (user) return <Navigate to={user.isAdmin ? '/admin' : '/'} replace />
  return children
}
