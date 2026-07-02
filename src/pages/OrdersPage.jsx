import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { orderApi } from '../utils/api'
import { useCart } from '../context/CartContext'
import BottomNav from '../components/layout/BottomNav'
import { ChevronLeft, ChevronRight, ExternalLink, Phone, MapPin } from 'lucide-react'
import { format, parseISO } from 'date-fns'

const STATUS_CONFIG = {
  pending: { label: 'Pending', cls: 'status-pending', emoji: '🕐', step: 0 },
  confirmed: { label: 'Confirmed', cls: 'status-confirmed', emoji: '✅', step: 1 },
  shipped: { label: 'Out for Delivery', cls: 'status-shipped', emoji: '🚚', step: 2 },
  delivered: { label: 'Delivered', cls: 'status-delivered', emoji: '📦', step: 3 },
  cancelled: { label: 'Cancelled', cls: 'status-cancelled', emoji: '❌', step: -1 },
}

const formatPrice = (p) => p != null
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(p)
  : '₹0'

const DEMO_ORDERS = [
  {
    _id: 'demo1',
    orderId: 'ORD100001',
    status: 'delivered',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    items: [
      { name: 'SVT Gold Veg Oil', brand: 'SVT GOLD', weight: '5 Ltr', price: 1620, qty: 2, emoji: '🫙' },
      { name: 'Sun Shudh Sunflower Oil', brand: 'SUNSHUDH', weight: '1 Ltr', price: 1652, qty: 1, emoji: '🌻' },
    ],
    total: 4892,
    deliveryAddress: 'Near Market, Hubli',
    phone: '9876543210',
  },
  {
    _id: 'demo2',
    orderId: 'ORD100002',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      { name: 'Geo Gold Palm Oil', brand: 'GEO GOLD', weight: '15 Kg', price: 2491, qty: 1, emoji: '🌴' },
    ],
    total: 2491,
    deliveryAddress: 'Shop No. 12, Main Road, Dharwad',
    phone: '9876543210',
  },
  {
    _id: 'demo3',
    orderId: 'ORD100003',
    status: 'pending',
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Deepam Lamp Oil', brand: 'DEEPAM', weight: '1 Ltr', price: 163, qty: 3, emoji: '🪔' },
      { name: 'Groundnut Oil', brand: 'PREMIUM', weight: '1 Ltr', price: 330, qty: 2, emoji: '🥜' },
    ],
    total: 1149,
    hasNegotiable: false,
    deliveryAddress: 'Near Market, Hubli',
    phone: '9876543210',
  }
]

function OrderCard({ order, onClick }) {
  const { setCartItems } = useCart()
  const navigate = useNavigate()
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const itemSummary = order.items?.map(i => `${i.name}${i.weight ? ` (${i.weight})` : ''} x${i.qty}`).join(', ') || ''
  const dateStr = order.createdAt
    ? format(parseISO(order.createdAt), 'dd MMM yyyy')
    : ''

  const handleReorderClick = (e) => {
    e.stopPropagation()
    if (!order?.items) return
    const cartItems = order.items.map(item => {
      const isNego = item.isNegotiable || item.price === 0;
      return {
        _id: item.product,
        cartKey: item.variantId ? `${item.product}-${item.variantId}` : item.product,
        variantId: item.variantId,
        name: item.name,
        brand: item.brand,
        weight: item.weight,
        imageUrl: item.imageUrl,
        emoji: item.emoji,
        price: isNego ? null : item.price,
        discountPrice: null,
        isNegotiable: isNego,
        qty: item.qty,
      }
    })
    setCartItems(cartItems)
    navigate('/cart')
  }

  return (
    <div className="order-card" onClick={onClick}>
      <div className="order-card-header">
        <div>
          <div className="order-id">#{order.orderId || order._id?.slice(-6).toUpperCase()}</div>
          <div style={{ fontSize: '0.75rem', color: '#A8A29E', marginTop: '2px' }}>{dateStr}</div>
        </div>
        <span className={`order-status-badge ${cfg.cls}`}>
          {cfg.emoji} {cfg.label}
        </span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        <p style={{ fontSize: '0.83rem', color: '#57534E', marginBottom: '8px', lineHeight: '1.4' }}>
          {itemSummary.length > 60 ? itemSummary.slice(0, 57) + '...' : itemSummary}
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>
            {order.hasNegotiable && !order.total ? 'Price to be confirmed' : formatPrice(order.total)}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleReorderClick}
              style={{
                padding: '5px 12px', border: '1px solid var(--saffron)',
                background: '#FFFBEB', color: 'var(--saffron-dark)',
                borderRadius: '50px', fontSize: '0.75rem', fontWeight: '800',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
              }}
            >
              🔁 Reorder
            </button>
            <span style={{ color: '#C2410C', fontWeight: '700', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
              View Details <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// STATUS TRACKER 
function StatusTracker({ status }) {
  const steps = [
    { key: 'pending', label: 'Order\nPlaced', emoji: '📝' },
    { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
    { key: 'shipped', label: 'On the\nWay', emoji: '🚚' },
    { key: 'delivered', label: 'Delivered', emoji: '🎉' },
  ]
  if (status === 'cancelled') {
    return (
      <div style={{ padding: '16px 20px', background: '#FEE2E2', borderRadius: '12px', margin: '12px 16px', textAlign: 'center' }}>
        <span style={{ fontSize: '1.3rem' }}>❌</span>
        <div style={{ fontWeight: '700', color: '#991B1B', marginTop: '4px' }}>Order Cancelled</div>
      </div>
    )
  }
  const currentStep = STATUS_CONFIG[status]?.step ?? 0
  return (
    <div style={{ padding: '16px 20px', position: 'relative' }}>
      <div style={{
        position: 'absolute', top: '32px', left: '40px', right: '40px',
        height: '2px', background: '#E7E5E4', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', top: '32px', left: '40px',
        height: '2px', background: 'var(--saffron)',
        width: `${Math.min(100, (currentStep / 3) * 100)}%`, zIndex: 1,
        transition: 'width 0.5s ease'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
        {steps.map((step, i) => {
          const done = i < currentStep
          const active = i === currentStep
          return (
            <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
                background: done ? 'var(--green-fresh)' : active ? 'var(--saffron)' : 'white',
                border: `2px solid ${done ? 'var(--green-fresh)' : active ? 'var(--saffron)' : '#E7E5E4'}`,
                boxShadow: active ? '0 0 0 4px rgba(245,158,11,0.2)' : 'none',
              }}>
                {done ? '✓' : step.emoji}
              </div>
              <div style={{
                fontSize: '0.63rem', fontWeight: '600', textAlign: 'center',
                color: done || active ? 'var(--text-dark)' : 'var(--text-light)',
                whiteSpace: 'pre-line', lineHeight: 1.3,
              }}>
                {step.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ORDER DETAIL
function OrderDetailPage({ orderId }) {
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const { setCartItems } = useCart()

  const handleReorder = () => {
    if (!order?.items) return
    const cartItems = order.items.map(item => {
      const isNego = item.isNegotiable || item.price === 0;
      return {
        _id: item.product,
        cartKey: item.variantId ? `${item.product}-${item.variantId}` : item.product,
        variantId: item.variantId,
        name: item.name,
        brand: item.brand,
        weight: item.weight,
        imageUrl: item.imageUrl,
        emoji: item.emoji,
        price: isNego ? null : item.price,
        discountPrice: null,
        isNegotiable: isNego,
        qty: item.qty,
      }
    })
    setCartItems(cartItems)
    navigate('/cart')
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      const res = await orderApi.getOne(orderId)
      setOrder(res.data.order)
    } catch {
      const demo = DEMO_ORDERS.find(o => o._id === orderId)
      setOrder(demo || null)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm) { doCancelOrder(); return; }
    setCancelling(true)
    try {
      await orderApi.cancel(orderId)
      setOrder(o => ({ ...o, status: 'cancelled' }))
    } catch {
      setOrder(o => ({ ...o, status: 'cancelled' }))
    } finally {
      setCancelling(false)
    }
  }

  const doCancelOrder = () => handleCancel()

  if (loading) return <div className="spinner" />
  if (!order) return (
    <div className="empty-state">
      <div className="emoji">😕</div>
      <h3>Order not found</h3>
      <button className="btn-primary" onClick={() => navigate('/orders')} style={{ marginTop: '16px' }}>
        Back to Orders
      </button>
    </div>
  )

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
  const dateStr = order.createdAt ? format(parseISO(order.createdAt), 'dd MMM yyyy, hh:mm a') : ''
  const hasMapLocation = Number.isFinite(order.deliveryLocation?.lat) && Number.isFinite(order.deliveryLocation?.lng)
  const mapUrl = hasMapLocation
    ? `https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`
    : ''

  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, #7C2D12, #C2410C)', padding: '48px 20px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/orders')} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Order Details</h1>
            <p style={{ fontSize: '0.78rem', opacity: 0.8 }}>#{order.orderId || order._id?.slice(-6).toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* Status tracker */}
      <div style={{ background: 'white', margin: '12px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className={`order-status-badge ${cfg.cls}`} style={{ fontSize: '0.82rem', padding: '5px 12px' }}>
            {cfg.emoji} {cfg.label}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#A8A29E' }}>{dateStr}</span>
        </div>
        <StatusTracker status={order.status} />
      </div>

      {/* Items */}
      <div style={{ background: 'white', margin: '0 12px 12px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F5F5F4', fontWeight: '800', fontSize: '0.95rem' }}>
          🛒 Items Ordered
        </div>
        {order.items?.map((item, i) => (
          <div key={i} style={{ padding: '12px 16px', borderBottom: i < order.items.length - 1 ? '1px solid #F5F5F4' : 'none', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '1.8rem', width: '44px', height: '44px', background: '#FEF3C7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {item.emoji || '🫙'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{item.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#A8A29E' }}>{item.brand} {item.weight && `• ${item.weight}`}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                {item.isNegotiable ? '🤝 Nego' : formatPrice(item.price * item.qty)}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#A8A29E' }}>x{item.qty}</div>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 16px', background: '#FAFAF9', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '800' }}>Total</span>
          <span style={{ fontWeight: '800', color: 'var(--green-fresh)' }}>
            {order.total ? formatPrice(order.total) : '—'}
          </span>
        </div>
      </div>

      {/* Delivery info */}
      <div style={{ background: 'white', margin: '0 12px 12px', borderRadius: '16px', boxShadow: 'var(--shadow-sm)', padding: '14px 16px' }}>
        <div style={{ fontWeight: '800', fontSize: '0.95rem', marginBottom: '12px' }}>📍 Shop / Delivery Info</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
          <MapPin size={16} color="#C2410C" style={{ marginTop: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '0.88rem', color: '#57534E', lineHeight: 1.5 }}>{order.deliveryAddress}</span>
        </div>
        {hasMapLocation && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '10px',
              color: '#C2410C',
              fontSize: '0.82rem',
              fontWeight: 800,
              textDecoration: 'none',
            }}
          >
            Open map location <ExternalLink size={14} />
          </a>
        )}
        {order.phone && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Phone size={16} color="#C2410C" />
            <span style={{ fontSize: '0.88rem', color: '#57534E' }}>+91 {order.phone}</span>
          </div>
        )}
        {order.note && (
          <div style={{ marginTop: '10px', background: '#FEF3C7', borderRadius: '10px', padding: '10px', fontSize: '0.83rem', color: '#92400E' }}>
            📝 Note: {order.note}
          </div>
        )}
      </div>

      {/* Reorder button */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={handleReorder}
          style={{
            width: '100%', padding: '14px', border: 'none',
            background: 'linear-gradient(135deg, var(--saffron-dark), var(--saffron))',
            color: 'white', borderRadius: '50px',
            fontFamily: 'Baloo 2, sans-serif', fontSize: '0.95rem', fontWeight: '700',
            cursor: 'pointer', boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
          }}
        >
          🔁 Reorder Items Again
        </button>
      </div>

      {/* Cancel button */}
      {order.status === 'pending' && (
        <div style={{ padding: '0 12px 24px' }}>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            style={{
              width: '100%', padding: '14px', border: '2px solid #EF4444',
              background: 'white', color: '#EF4444', borderRadius: '50px',
              fontFamily: 'Baloo 2, sans-serif', fontSize: '0.95rem', fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {cancelling ? '⏳ Cancelling...' : '❌ Cancel Order'}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div style={{ display: 'grid', gap: '12px', padding: '12px' }}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="order-card" style={{ padding: '16px', background: 'white', borderRadius: '16px', border: '1px solid var(--border)', cursor: 'default', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
            <div>
              <div className="skeleton" style={{ width: '80px', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '60px', height: '12px', marginTop: '6px', borderRadius: '4px' }} />
            </div>
            <div className="skeleton" style={{ width: '90px', height: '26px', borderRadius: '20px' }} />
          </div>
          <div style={{ borderTop: '1px solid #F5F5F4', paddingTop: '12px', marginTop: '8px' }}>
            <div className="skeleton" style={{ width: '80%', height: '14px', marginBottom: '14px', borderRadius: '4px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="skeleton" style={{ width: '100px', height: '18px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ORDERS LIST PAGE
export default function OrdersPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) fetchOrders()
  }, [id])

  const fetchOrders = async () => {
    try {
      const res = await orderApi.myOrders()
      setOrders(res.data.orders || [])
    } catch {
      setOrders(DEMO_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  // Show detail if ID in URL
  if (id) return <OrderDetailPage orderId={id} />

  return (
    <div className="page">
      <div style={{ background: 'linear-gradient(135deg, #7C2D12, #C2410C)', padding: '48px 20px 20px', color: 'white', position: 'sticky', top: 0, zIndex: 50 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: '800' }}>📦 My Orders</h1>
        <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '2px' }}>Track all your orders here</p>
      </div>

      <div style={{ paddingTop: '12px' }}>
        {loading ? (
          <OrdersSkeleton />
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">📭</div>
            <h3>No orders yet</h3>
            <p>Your orders will appear here once you place them!</p>
            <button className="btn-primary" onClick={() => navigate('/')} style={{ marginTop: '20px', maxWidth: '200px' }}>
              🌻 Shop Now
            </button>
          </div>
        ) : (
          orders.map(order => (
            <OrderCard key={order._id} order={order} onClick={() => navigate(`/orders/${order._id}`)} />
          ))
        )}
      </div>

      <BottomNav />
    </div>
  )
}
