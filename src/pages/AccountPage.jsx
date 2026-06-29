import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { authApi, locationApi } from '../utils/api'
import BottomNav from '../components/layout/BottomNav'
import { Package, MapPin, Phone, LogOut, ChevronRight, Edit2, Shield, LocateFixed, Loader2 } from 'lucide-react'

const getBrowserPosition = () => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(resolve, reject, {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 60000,
  })
})

const getLocationErrorMessage = (error) => {
  if (error?.code === 1) return 'Location permission was denied'
  if (error?.code === 2) return 'Could not detect your location'
  if (error?.code === 3) return 'Location request timed out'
  return 'Could not use current location'
}

export default function AccountPage() {
  const { user, logout, updateUser } = useAuth()
  const addToast = useToast()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [secondaryPhone, setSecondaryPhone] = useState(user?.secondaryPhone || '')
  const [gstNumber, setGstNumber] = useState(user?.gstNumber || '')
  const [address, setAddress] = useState(user?.address || '')
  const [addressLocation, setAddressLocation] = useState(user?.addressLocation || null)
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { addToast('Name cannot be empty', 'error'); return }
    setSaving(true)
    try {
      const res = await authApi.updateProfile({ name, secondaryPhone, gstNumber, address, addressLocation })
      updateUser(res.data.user)
      addToast('Profile updated! ✅', 'success')
      setEditing(false)
    } catch {
      updateUser({ ...user, name, secondaryPhone, gstNumber, address, addressLocation })
      addToast('Profile updated locally! ✅', 'success')
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      addToast('Location is not supported on this device', 'error')
      return
    }

    setLocating(true)
    try {
      const position = await getBrowserPosition()
      const lat = Number(position.coords.latitude.toFixed(6))
      const lng = Number(position.coords.longitude.toFixed(6))
      const location = { lat, lng, source: 'browser' }

      setAddressLocation(location)

      try {
        const res = await locationApi.reverse({ lat, lng })
        const detectedAddress = res.data.address || res.data.displayName
        if (detectedAddress) {
          setAddress(detectedAddress)
          addToast('Location added. Please confirm the address.', 'success')
          return
        }
      } catch {
        // Keep the coordinates even if reverse geocoding is unavailable.
      }

      setAddress(prev => prev || `Lat: ${lat}, Lng: ${lng}`)
      addToast('Location added. Please complete the address.', 'info')
    } catch (err) {
      addToast(getLocationErrorMessage(err), 'error')
    } finally {
      setLocating(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/auth')
    addToast('Logged out. See you soon! 👋', 'info')
  }

  const firstName = user?.name?.split(' ')[0] || 'User'
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  const menuItems = [
    {
      icon: <Package size={20} />, label: 'My Orders', sub: 'Track & view all orders',
      color: '#7C3AED', bg: '#F3E8FF', action: () => navigate('/orders')
    },
    {
      icon: <MapPin size={20} />, label: 'Shop Name / Address', sub: user?.address || 'Add your shop name',
      color: '#EA580C', bg: '#FEF3C7', action: () => setEditing(true)
    },
    {
      icon: <Phone size={20} />, label: 'Contact Number', sub: user?.phone ? `+91 ${user.phone}` : '—',
      color: '#16A34A', bg: '#DCFCE7', action: null
    },
    {
      icon: <span style={{ fontSize: '1.2rem' }}>📄</span>, label: 'GST Number (Optional)', sub: user?.gstNumber || 'Not provided',
      color: '#0284C7', bg: '#E0F2FE', action: () => setEditing(true)
    },
    {
      icon: <Shield size={20} />, label: 'Privacy & Security', sub: 'Your data is safe 🔒',
      color: '#2563EB', bg: '#DBEAFE', action: null
    },
  ]

  return (
    <div className="page">
      {/* Profile header */}
      <div className="profile-header">
        <div className="avatar-circle">{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>{user?.name || 'Guest'}</div>
          {user?.phone && (
            <div style={{ fontSize: '0.82rem', opacity: 0.8, marginTop: '2px' }}>
              +91 {user.phone}
              {user.secondaryPhone && ` | +91 ${user.secondaryPhone}`}
            </div>
          )}
          {user?.isAdmin && (
            <div style={{ marginTop: '6px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>
                👑 Admin
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
        >
          <Edit2 size={18} />
        </button>
      </div>

      {/* Edit profile modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ padding: '8px 20px 24px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '20px' }}>✏️ Edit Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>Full Name</label>
                  <input className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>Secondary Mobile Number (Optional)</label>
                  <input className="input-field" value={secondaryPhone} onChange={e => setSecondaryPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit secondary number" type="tel" inputMode="numeric" />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>GST Number (Optional)</label>
                  <input className="input-field" value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#57534E', marginBottom: '6px', display: 'block' }}>Shop Name / Address</label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locating}
                    style={{
                      width: '100%',
                      border: '1.5px solid #F59E0B',
                      background: '#FFFBF0',
                      color: '#92400E',
                      borderRadius: '10px',
                      padding: '11px 12px',
                      marginBottom: '10px',
                      fontFamily: 'Baloo 2, sans-serif',
                      fontWeight: 800,
                      cursor: locating ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {locating ? <Loader2 size={17} className="spin-icon" /> : <LocateFixed size={17} />}
                    {locating ? 'Detecting location...' : 'Use current location'}
                  </button>
                  <textarea
                    className="input-field"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Your shop name / delivery address..."
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                  {addressLocation && (
                    <div style={{ fontSize: '0.76rem', color: '#16A34A', fontWeight: 700, marginTop: '6px' }}>
                      Map location will be saved with this address.
                    </div>
                  )}
                </div>
                <button className="btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '⏳ Saving...' : '✅ Save Changes'}
                </button>
                <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin panel shortcut */}
      {user?.isAdmin && (
        <div style={{ margin: '12px 12px 0', background: 'linear-gradient(135deg, #1E1B4B, #3730A3)', borderRadius: '16px', padding: '16px', color: 'white', cursor: 'pointer' }}
          onClick={() => navigate('/admin')}>
          <div style={{ fontWeight: '800', fontSize: '1rem' }}>👑 Admin Dashboard</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '3px' }}>Manage orders, users & products</div>
        </div>
      )}

      {/* Menu items */}
      <div style={{ marginTop: '16px' }}>
        {menuItems.map((item, i) => (
          <div key={i} className="menu-item" onClick={item.action || undefined}
            style={{ cursor: item.action ? 'pointer' : 'default' }}>
            <div className="menu-icon" style={{ background: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.77rem', color: '#A8A29E', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                {item.sub}
              </div>
            </div>
            {item.action && <ChevronRight size={18} color="#A8A29E" />}
          </div>
        ))}
      </div>

      {/* App info */}
      <div style={{ padding: '20px 16px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>🫙</div>
        <div style={{ fontSize: '1rem', fontWeight: '800', color: '#C2410C' }}>SVT Oils</div>
        <div style={{ fontSize: '0.75rem', color: '#A8A29E', marginTop: '2px' }}>Version 1.0.0</div>
        <div style={{ fontSize: '0.75rem', color: '#78716C', marginTop: '6px', fontWeight: '600' }}>Build and developed by <a href="https://shakti-software-pseq.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Shakti Softwares</a>.<br />(8904286980)</div>
      </div>

      {/* Logout */}
      <div style={{ padding: '8px 12px 24px' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '14px', border: '1.5px solid #E7E5E4',
            background: 'white', color: '#78716C', borderRadius: '50px',
            fontFamily: 'Baloo 2, sans-serif', fontSize: '0.95rem', fontWeight: '700',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <LogOut size={17} />
          Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
