import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { locationApi, orderApi } from '../utils/api'
import BottomNav from '../components/layout/BottomNav'
import { Trash2, ChevronLeft, LocateFixed, Loader2, MapPin, Phone } from 'lucide-react'

const formatPrice = (p) => p != null
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(p)
  : '₹0'

const CATEGORY_EMOJI = {
  sunflower: '🌻', groundnut: '🥜', palm: '🌴', coconut: '🥥',
  mustard: '🌿', soybean: '🫘', safflower: '🌸', vegetable: '🍀',
  lamp: '🪔', default: '🫙',
}
const getEmoji = (p) => {
  if (p.emoji) return p.emoji
  const key = Object.keys(CATEGORY_EMOJI).find(k => (p.category || '').toLowerCase().includes(k))
  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI.default
}

const parseQty = (value) => {
  const qty = Number.parseInt(value, 10)
  if (!Number.isFinite(qty) || qty < 0) return 0
  return Math.min(qty, 9999)
}

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

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, totalPrice, hasNegotiable, totalItems } = useCart()
  const { user } = useAuth()
  const addToast = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState('cart') // 'cart' | 'address' | 'placing'
  const [address, setAddress] = useState(user?.address || '')
  const [deliveryLocation, setDeliveryLocation] = useState(user?.addressLocation || null)
  const [locating, setLocating] = useState(false)
  const [phone, setPhone] = useState(user?.phone || '')
  const [note, setNote] = useState('')
  const placingRef = useRef(false)
  const orderKeyRef = useRef(null)

  const handleCheckout = () => {
    if (items.length === 0) return
    setStep('address')
    window.scrollTo(0, 0)
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

      setDeliveryLocation(location)

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

  const handlePlaceOrder = async () => {
    if (placingRef.current || step === 'placing') return
    if (!address.trim()) { addToast('Please enter shop name', 'error'); return }
    if (!phone || phone.length < 10) { addToast('Please enter valid phone number', 'error'); return }

    placingRef.current = true
    if (!orderKeyRef.current) {
      orderKeyRef.current = `order-${user?._id || phone}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    }
    const idempotencyKey = orderKeyRef.current
    setStep('placing')
    try {
      const orderItems = items.map(i => ({
        product: i._id,
        variantId: i.variantId,
        name: i.name,
        brand: i.brand,
        weight: i.weight,
        imageUrl: i.imageUrl,
        price: i.discountPrice ?? i.price ?? 0,
        qty: i.qty,
        isNegotiable: i.isNegotiable || false,
      }))

      const res = await orderApi.place({
        items: orderItems,
        deliveryAddress: address,
        deliveryLocation,
        phone,
        note,
        total: totalPrice,
        hasNegotiable,
        idempotencyKey,
      })

      clearCart()
      orderKeyRef.current = null
      addToast('Order placed successfully! 🎉', 'order')
      navigate(`/orders/${res.data.order._id}`)
    } catch (err) {
      placingRef.current = false
      setStep('address')
      addToast(err.response?.data?.message || 'Failed to place order. Please try again.', 'error')
    }
  }

  if (items.length === 0 && step !== 'placing') {
    return (
      <div className="page">
        <div style={{ background: 'linear-gradient(135deg, #7C2D12, #C2410C)', padding: '48px 20px 20px', color: 'white' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: '800' }}>🛒 My Cart</h1>
        </div>
        <div className="empty-state" style={{ marginTop: '40px' }}>
          <div className="emoji">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some fresh oils to get started!</p>
          <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px', maxWidth: '200px' }}>
            🌻 Browse Products
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #7C2D12, #C2410C)', padding: '48px 20px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {step === 'address' && (
            <button onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}>
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: '800' }}>
              {step === 'cart' ? `🛒 Cart (${totalItems})` : '📍 Shop Name / Address'}
            </h1>
            {step === 'cart' && items.length > 0 && (
              <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>{items.length} type{items.length > 1 ? 's' : ''} of oil selected</p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '14px' }}>
          {['Cart', 'Address', 'Done'].map((s, i) => (
            <div key={s} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= (['cart','address','done'].indexOf(step)) ? 'white' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
      </div>

      {step === 'cart' ? (
        <>
          {/* Cart items */}
          <div style={{ marginTop: '12px' }}>
            {items.map(item => {
              const itemPrice = item.isNegotiable ? null : (item.discountPrice ?? item.price)
              const lineTotal = itemPrice != null ? itemPrice * item.qty : null
              return (
                <div key={item.cartKey || item._id} className="cart-item">
                  <div className="cart-item-emoji">{getEmoji(item)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-sub">{item.brand} {item.weight && `• ${item.weight}`}</div>
                    {item.isNegotiable ? (
                      <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#7C3AED', marginTop: '4px' }}>
                        🤝 Negotiable price
                      </div>
                    ) : (
                      <div className="cart-item-price">{lineTotal != null ? formatPrice(lineTotal) : '—'}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <button
                      onClick={() => removeItem(item.cartKey || item._id)}
                      style={{ background: '#FEE2E2', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="qty-control" style={{ width: '90px' }}>
                      <button className="qty-btn" onClick={() => updateQty(item.cartKey || item._id, item.qty - 1)}>−</button>
                      <input
                        className="qty-input"
                        type="number"
                        min="0"
                        max="9999"
                        value={item.qty}
                        onChange={e => updateQty(item.cartKey || item._id, parseQty(e.target.value))}
                        aria-label={`Quantity for ${item.name}`}
                      />
                      <button className="qty-btn" onClick={() => updateQty(item.cartKey || item._id, item.qty + 1)}>+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Price summary */}
          <div style={{ margin: '16px 12px', background: 'white', borderRadius: '16px', padding: '16px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '12px' }}>💰 Price Summary</div>
            {items.map(item => {
              const itemPrice = item.isNegotiable ? null : (item.discountPrice ?? item.price)
              return (
                <div key={item.cartKey || item._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#57534E', flex: 1 }}>{item.name} {item.weight && `(${item.weight})`} x{item.qty}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: item.isNegotiable ? '#7C3AED' : '#1C1917', marginLeft: '8px' }}>
                    {item.isNegotiable ? 'Nego' : (itemPrice != null ? formatPrice(itemPrice * item.qty) : '—')}
                  </span>
                </div>
              )
            })}
            <div style={{ borderTop: '1px solid #E7E5E4', marginTop: '10px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: '800' }}>Total</span>
              <span style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--green-fresh)' }}>
                {totalPrice > 0 ? formatPrice(totalPrice) : '—'}
                {hasNegotiable && <span style={{ fontSize: '0.72rem', color: '#7C3AED' }}> + Nego</span>}
              </span>
            </div>
            {hasNegotiable && (
              <div style={{ background: '#F3E8FF', borderRadius: '10px', padding: '10px', marginTop: '10px', fontSize: '0.8rem', color: '#5B21B6' }}>
                🤝 <strong>Some items have negotiable pricing.</strong> Our team will contact you to confirm the final price before delivery.
              </div>
            )}
          </div>

          {/* Checkout button */}
          <div style={{ padding: '0 12px 24px' }}>
            <button className="btn-primary" onClick={handleCheckout} style={{ fontSize: '1.05rem', padding: '16px' }}>
              📍 Continue to Checkout →
            </button>
          </div>
        </>
      ) : step === 'address' ? (
        <>
          {/* Delivery form */}
          <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '12px', fontSize: '0.83rem', fontWeight: '600', color: '#92400E' }}>
              📦 {totalItems} item{totalItems > 1 ? 's' : ''} · {hasNegotiable ? 'Price to be confirmed' : formatPrice(totalPrice)}
            </div>

            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#57534E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Shop Name / Address *
              </label>
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
                placeholder="Shop/House No., Street, Area, City..."
                value={address}
                onChange={e => setAddress(e.target.value)}
                rows={3}
                style={{ resize: 'none', fontSize: '0.95rem' }}
              />
              {deliveryLocation && (
                <div style={{ fontSize: '0.76rem', color: '#16A34A', fontWeight: 700, marginTop: '6px' }}>
                  Map location attached to this order.
                </div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#57534E', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Phone size={16} /> Mobile Number *
              </label>
              <input
                className="input-field"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                type="tel"
                inputMode="numeric"
                style={{ fontSize: '1rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.88rem', fontWeight: '700', color: '#57534E', marginBottom: '8px', display: 'block' }}>
                📝 Special Instructions (optional)
              </label>
              <textarea
                className="input-field"
                placeholder="Any specific instructions for delivery..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                style={{ resize: 'none', fontSize: '0.9rem' }}
              />
            </div>

            <button className="btn-primary" onClick={handlePlaceOrder} disabled={step === 'placing' || placingRef.current} style={{ marginTop: '8px', fontSize: '1.05rem', padding: '16px', opacity: placingRef.current ? 0.7 : 1 }}>
              ✅ Place Order Now
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#A8A29E' }}>
              🔒 Your order is safe. We'll call to confirm.
            </p>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '24px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⏳</div>
          <h3 style={{ fontSize: '1.2rem' }}>Placing your order...</h3>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
