import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'success', duration = 2800) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const icons = { success: '✅', error: '❌', info: 'ℹ️', cart: '🛒', order: '📦' }
  const colors = {
    success: { bg: '#16A34A', color: 'white' },
    error: { bg: '#EF4444', color: 'white' },
    info: { bg: '#2563EB', color: 'white' },
    cart: { bg: '#D97706', color: 'white' },
    order: { bg: '#7C3AED', color: 'white' },
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: '90px', left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: '440px',
        padding: '0 16px',
        zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: '8px',
        pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: colors[t.type]?.bg || '#333',
            color: colors[t.type]?.color || 'white',
            borderRadius: '14px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            animation: 'fadeUp 0.3s ease',
            fontFamily: 'Baloo 2, Nunito, sans-serif',
            fontSize: '0.9rem',
            fontWeight: '600',
          }}>
            <span style={{ fontSize: '1.1rem' }}>{icons[t.type] || '✅'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx.addToast
}
