import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('svt_token')
    const userData = localStorage.getItem('svt_user')
    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } catch {
        localStorage.removeItem('svt_token')
        localStorage.removeItem('svt_user')
      }
    }
    setLoading(false)
  }, [])

  const login = (userData, token) => {
    localStorage.setItem('svt_token', token)
    localStorage.setItem('svt_user', JSON.stringify(userData))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('svt_token')
    localStorage.removeItem('svt_user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const updateUser = (updated) => {
    const merged = { ...user, ...updated }
    setUser(merged)
    localStorage.setItem('svt_user', JSON.stringify(merged))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
