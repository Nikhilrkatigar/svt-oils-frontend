import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authApi } from '../utils/api'
import { Eye, EyeOff } from 'lucide-react'

export default function AuthPage() {
  const [mode, setMode] = useState('login')
  const [phone, setPhone] = useState('')
  const [secondaryPhone, setSecondaryPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const addToast = useToast()
  const navigate = useNavigate()

  const isRegister = mode === 'register'

  const resetMode = (nextMode) => {
    setMode(nextMode)
    setPassword('')
    setShowPassword(false)
  }

  const validateCommonFields = () => {
    if (!phone || phone.length !== 10) {
      addToast('Please enter a valid 10-digit mobile number', 'error')
      return false
    }
    if (!password || password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return false
    }
    return true
  }

  const handleLogin = async () => {
    if (!validateCommonFields()) return

    setLoading(true)
    try {
      const res = await authApi.login({ phone, password })
      login(res.data.user, res.data.token)
      addToast(`Welcome back, ${res.data.user.name}!`, 'success')
      navigate(res.data.user.isAdmin ? '/admin' : '/')
    } catch (err) {
      addToast(err.response?.data?.message || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!name.trim()) { addToast('Please enter your name', 'error'); return }
    if (!validateCommonFields()) return
    if (!address.trim()) { addToast('Please enter your shop name', 'error'); return }

    setLoading(true)
    try {
      const res = await authApi.register({ name, phone, secondaryPhone, address, password })
      login(res.data.user, res.data.token)
      addToast(`Welcome to SVT Oils, ${name}!`, 'success')
      navigate(res.data.user.isAdmin ? '/admin' : '/')
    } catch (err) {
      addToast(err.response?.data?.message || 'Registration failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <img
          src="/svt-logo.png"
          alt="SVT Gold"
          style={{
            width: '132px',
            maxWidth: '50vw',
            background: 'white',
            borderRadius: '12px',
            padding: '10px',
            marginBottom: '14px',
          }}
        />
        <div className="auth-logo-big">
          SVT <span style={{ color: '#FBBF24' }}>Oils</span>
        </div>
        <p className="auth-tagline">Pure oils, delivered to your door</p>
        <p style={{ marginTop: '6px', fontSize: '0.85rem', opacity: 0.7 }}>
          Login with your mobile number and password
        </p>
      </div>

      <div className="auth-card fade-up">
        <div style={{
          display: 'flex', background: '#F5F5F4', borderRadius: '50px',
          padding: '4px', marginBottom: '24px'
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => resetMode(m)}
              style={{
                flex: 1, padding: '10px', border: 'none', borderRadius: '50px',
                fontFamily: 'Baloo 2, sans-serif', fontSize: '0.9rem', fontWeight: '700',
                cursor: 'pointer', transition: 'all 0.2s',
                background: mode === m ? 'white' : 'transparent',
                color: mode === m ? '#C2410C' : '#78716C',
                boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
              }}>
              {m === 'login' ? 'Login' : 'New Account'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isRegister && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>
                Your Full Name
              </label>
              <input
                className="input-field"
                placeholder="e.g. Rajesh Kumar"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
                style={{ fontSize: '1.05rem' }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>
              {isRegister ? 'Primary Mobile Number' : 'Mobile Number'}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                background: '#F5F5F4', borderRadius: '10px', padding: '14px 12px',
                fontSize: '0.95rem', fontWeight: '700', color: '#57534E', whiteSpace: 'nowrap'
              }}>+91</div>
              <input
                className="input-field"
                placeholder={isRegister ? "10-digit primary number" : "10-digit registered number"}
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                style={{ fontSize: '1.1rem', flex: 1 }}
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>
                Secondary Mobile Number (Optional)
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{
                  background: '#F5F5F4', borderRadius: '10px', padding: '14px 12px',
                  fontSize: '0.95rem', fontWeight: '700', color: '#57534E', whiteSpace: 'nowrap'
                }}>+91</div>
                <input
                  className="input-field"
                  placeholder="10-digit secondary number"
                  value={secondaryPhone}
                  onChange={e => setSecondaryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  type="tel"
                  inputMode="numeric"
                  style={{ fontSize: '1.1rem', flex: 1 }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                className="input-field"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                style={{ fontSize: '1.05rem', paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: '#78716C',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>
                Shop Name / Address
              </label>
              <textarea
                className="input-field"
                placeholder="Shop name, Street, Area, City..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={2}
                style={{ resize: 'none', fontSize: '0.95rem' }}
              />
            </div>
          )}

          <button className="btn-primary" onClick={isRegister ? handleRegister : handleLogin} disabled={loading}
            style={{ marginTop: '8px' }}>
            {loading ? 'Please wait...' : isRegister ? 'Create Account' : 'Login'}
          </button>
        </div>

        <p style={{
          textAlign: 'center', marginTop: '20px', fontSize: '0.78rem',
          color: '#A8A29E', lineHeight: '1.5'
        }}>
          By continuing, you agree to our Terms of Service.<br />
          Your data is safe with us.
        </p>
        <p style={{
          textAlign: 'center', marginTop: '10px', fontSize: '0.75rem',
          color: '#78716C', fontWeight: '600', lineHeight: '1.5'
        }}>
          Build and developed by <a href="https://shakti-software-pseq.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Shakti Softwares</a>.<br />
          (8904286980)
        </p>
      </div>
    </div>
  )
}
