import { useNavigate, useLocation } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { Home, ShoppingCart, Package, User } from 'lucide-react'

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems } = useCart()
  const path = location.pathname

  const items = [
    { icon: <Home size={22} />, label: 'Home', route: '/' },
    { icon: <ShoppingCart size={22} />, label: 'Cart', route: '/cart', badge: totalItems > 0 ? totalItems : null },
    { icon: <Package size={22} />, label: 'My Orders', route: '/orders' },
    { icon: <User size={22} />, label: 'Account', route: '/account' },
  ]

  return (
    <div className="bottom-nav">
      {items.map(item => {
        const active = path === item.route
        return (
          <button
            key={item.route}
            className={`nav-item ${active ? 'active' : ''}`}
            onClick={() => navigate(item.route)}
          >
            <div className="nav-icon-wrap" style={{ color: active ? 'var(--saffron-dark)' : 'var(--text-light)' }}>
              {item.icon}
              {item.badge && <span className="nav-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
            </div>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
