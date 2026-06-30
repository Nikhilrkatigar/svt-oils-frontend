import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ClipboardList,
  Edit2,
  Eye,
  EyeOff,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
  Settings as SettingsIcon,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { adminApi, orderApi, productApi, settingsApi } from '../utils/api'

const formatPrice = (value) => (
  value != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value)
    : 'Negotiable'
)

const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

const STATUS_OPTIONS = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}
const STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#0284C7',
  shipped: '#7C3AED',
  delivered: '#16A34A',
  cancelled: '#EF4444',
}

const EMPTY_PRODUCT = {
  name: '',
  brand: '',
  category: 'vegetable',
  weight: '',
  price: '',
  discountPrice: '',
  isNegotiable: true,
  isNew: false,
  description: '',
  imageUrl: '',
  emoji: '',
  inStock: true,
  variants: [],
  sortOrder: 999,
}

const EMPTY_VARIANT = {
  weight: '',
  price: '',
  discountPrice: '',
  isNegotiable: true,
  inStock: true,
}

const createEmptyProduct = () => ({ ...EMPTY_PRODUCT, variants: [] })

const createEmptyVariant = () => ({ ...EMPTY_VARIANT })

const normalizeFormVariants = (variants = []) => variants
  .filter(variant => variant.weight?.trim())
  .map(variant => {
    const priceIsBlank = variant.price === '' || variant.price == null
    return {
      weight: variant.weight.trim(),
      price: priceIsBlank ? null : Number(variant.price),
      discountPrice: variant.discountPrice === '' || variant.discountPrice == null
        ? null
        : Number(variant.discountPrice),
      isNegotiable: priceIsBlank ? true : Boolean(variant.isNegotiable),
      inStock: variant.inStock !== false,
    }
  })

const getProductVariants = (product) => product.variants || []

const getProductPriceLabel = (product) => {
  const variants = getProductVariants(product)
  if (!variants.length) return product.price == null ? 'Negotiable' : formatPrice(product.discountPrice ?? product.price)

  const prices = variants
    .filter(variant => !variant.isNegotiable && variant.price != null)
    .map(variant => variant.discountPrice ?? variant.price)

  if (!prices.length) return 'Negotiable'
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return min === max ? formatPrice(min) : `${formatPrice(min)} - ${formatPrice(max)}`
}

const getProductMetaLabel = (product) => {
  const variants = getProductVariants(product)
  if (!variants.length) return `${product.brand} | ${product.weight || 'No size'} | ${product.category}`

  const weights = variants.slice(0, 3).map(variant => variant.weight).join(', ')
  const suffix = variants.length > 3 ? ` +${variants.length - 3} more` : ''
  return `${product.brand} | ${variants.length} weights: ${weights}${suffix} | ${product.category}`
}

const EMPTY_USER = {
  name: '',
  phone: '',
  secondaryPhone: '',
  gstNumber: '',
  pinCode: '',
  password: '',
  address: '',
  role: 'customer',
  isBlocked: false,
}

export default function AdminPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const addToast = useToast()

  const [tab, setTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const [productModalId, setProductModalId] = useState(null)
  const [productForm, setProductForm] = useState(() => createEmptyProduct())
  const [userModalId, setUserModalId] = useState(null)
  const [userForm, setUserForm] = useState(EMPTY_USER)
  const [savingProduct, setSavingProduct] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
  const [showUserPassword, setShowUserPassword] = useState(false)
  const [uploadingProductImage, setUploadingProductImage] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState(null)
  const [settingsForm, setSettingsForm] = useState({ bulkOrderPhone: '', supportPhone: '' })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/')
      return
    }
    fetchAll()
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [statsRes, ordersRes, productsRes, usersRes, settingsRes] = await Promise.all([
        adminApi.dashboard(),
        orderApi.all({ limit: 100 }),
        productApi.getAll({ limit: 200 }),
        adminApi.users({ limit: 100 }),
        settingsApi.get().catch(() => ({ data: { bulkOrderPhone: '', supportPhone: '' } })),
      ])
      setStats(statsRes.data)
      setOrders(ordersRes.data.orders || [])
      setProducts(productsRes.data.products || [])
      setUsers(usersRes.data.users || [])
      setSettingsForm(settingsRes.data || { bulkOrderPhone: '', supportPhone: '' })
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to load admin data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await settingsApi.update(settingsForm)
      setSettingsForm(res.data)
      addToast('System settings updated successfully! ✅', 'success')
    } catch (error) {
      addToast(error.response?.data?.message || 'Failed to update settings', 'error')
    } finally {
      setSavingSettings(false)
    }
  }

  const filteredOrders = useMemo(() => (
    statusFilter === 'all' ? orders : orders.filter(order => order.status === statusFilter)
  ), [orders, statusFilter])

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase()
    if (!search) return users
    return users.filter(item =>
      item.name?.toLowerCase().includes(search) ||
      item.phone?.includes(search) ||
      item.address?.toLowerCase().includes(search) ||
      item.role?.toLowerCase().includes(search)
    )
  }, [users, userSearch])

  const openProductModal = (product = null) => {
    if (product) {
      setProductModalId(product._id)
      setProductForm({
        ...EMPTY_PRODUCT,
        ...product,
        price: product.price ?? '',
        discountPrice: product.discountPrice ?? '',
        sortOrder: product.sortOrder ?? 999,
        isNegotiable: product.price == null ? true : Boolean(product.isNegotiable),
        variants: (product.variants || []).map(variant => ({
          ...EMPTY_VARIANT,
          ...variant,
          price: variant.price ?? '',
          discountPrice: variant.discountPrice ?? '',
          isNegotiable: variant.price == null ? true : Boolean(variant.isNegotiable),
          inStock: variant.inStock !== false,
        })),
      })
      return
    }
    setProductModalId('new')
    setProductForm(createEmptyProduct())
  }

  const openUserModal = (item = null) => {
    setShowUserPassword(false)
    if (item) {
      setUserModalId(item._id)
      setUserForm({
        ...EMPTY_USER,
        ...item,
        password: '',
        role: item.role || (item.isAdmin ? 'staff' : 'customer'),
        isBlocked: Boolean(item.isBlocked),
      })
      return
    }
    setUserModalId('new')
    setUserForm(EMPTY_USER)
  }

  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.brand.trim()) {
      addToast('Product name and brand are required', 'error')
      return
    }

    const priceIsBlank = productForm.price === '' || productForm.price == null
    const payload = {
      ...productForm,
      price: priceIsBlank ? null : Number(productForm.price),
      discountPrice: productForm.discountPrice === '' || productForm.discountPrice == null
        ? null
        : Number(productForm.discountPrice),
      isNegotiable: priceIsBlank ? true : Boolean(productForm.isNegotiable),
      sortOrder: productForm.sortOrder === '' || productForm.sortOrder == null ? 999 : Number(productForm.sortOrder),
      variants: normalizeFormVariants(productForm.variants),
    }

    setSavingProduct(true)
    const currentModalId = productModalId
    const previousProduct = products.find(item => item._id === currentModalId)
    const tempId = `temp-product-${Date.now()}`
    try {
      if (currentModalId === 'new') {
        const optimisticProduct = {
          ...payload,
          _id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pending: true,
        }
        setProducts(prev => [optimisticProduct, ...prev])
        setProductModalId(null)
        setProductForm(createEmptyProduct())
        const res = await productApi.create(payload)
        setProducts(prev => prev.map(item => item._id === tempId ? res.data.product : item))
        addToast('Product added', 'success')
      } else {
        setProducts(prev => prev.map(item => item._id === currentModalId ? { ...item, ...payload, pending: true } : item))
        setProductModalId(null)
        setProductForm(createEmptyProduct())
        const res = await productApi.update(currentModalId, payload)
        setProducts(prev => prev.map(item => item._id === currentModalId ? res.data.product : item))
        addToast('Product updated', 'success')
      }
    } catch (err) {
      if (currentModalId === 'new') {
        setProducts(prev => prev.filter(item => item._id !== tempId))
      } else if (previousProduct) {
        setProducts(prev => prev.map(item => item._id === currentModalId ? previousProduct : item))
      }
      addToast(err.response?.data?.message || 'Failed to save product', 'error')
    } finally {
      setSavingProduct(false)
    }
  }

  const handleUploadProductImage = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setUploadingProductImage(true)
    try {
      const res = await productApi.uploadImage(formData)
      setProductForm(prev => ({ ...prev, imageUrl: res.data.imageUrl }))
      addToast('Product image uploaded', 'success')
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to upload image', 'error')
    } finally {
      setUploadingProductImage(false)
    }
  }

  const handleAddVariant = () => {
    setProductForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), createEmptyVariant()],
    }))
  }

  const handleUpdateVariant = (index, patch) => {
    setProductForm(prev => ({
      ...prev,
      variants: (prev.variants || []).map((variant, itemIndex) => (
        itemIndex === index ? { ...variant, ...patch } : variant
      )),
    }))
  }

  const handleRemoveVariant = (index) => {
    setProductForm(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      title,
      message,
      onConfirm: async () => {
        setConfirmDialog(null)
        await onConfirm()
      },
    })
  }

  const handleDeleteProduct = async (id) => {
    requestConfirm('Delete Product', 'Are you sure you want to delete this product?', async () => {
      const removedProduct = products.find(item => item._id === id)
      setProducts(prev => prev.filter(item => item._id !== id))
      try {
        await productApi.delete(id)
        addToast('Product deleted', 'success')
      } catch (err) {
        if (removedProduct) setProducts(prev => [removedProduct, ...prev])
        addToast(err.response?.data?.message || 'Failed to delete product', 'error')
      }
    })
  }

  const handleDeleteUser = async (id) => {
    requestConfirm('Delete User', 'Are you sure you want to delete this user? This action cannot be undone.', async () => {
      const removedUser = users.find(item => item._id === id)
      setUsers(prev => prev.filter(item => item._id !== id))
      try {
        await adminApi.deleteUser(id)
        addToast('User deleted', 'success')
      } catch (err) {
        if (removedUser) setUsers(prev => [removedUser, ...prev])
        addToast(err.response?.data?.message || 'Failed to delete user', 'error')
      }
    })
  }

  const handleUpdateStatus = async (orderId, status) => {
    const previousOrder = orders.find(order => order._id === orderId)
    setUpdatingOrderId(orderId)
    setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status, pending: true } : order))
    try {
      const res = await orderApi.updateStatus(orderId, status)
      setOrders(prev => prev.map(order => order._id === orderId ? res.data.order : order))
      addToast('Order status updated', 'success')
    } catch (err) {
      if (previousOrder) setOrders(prev => prev.map(order => order._id === orderId ? previousOrder : order))
      addToast(err.response?.data?.message || 'Failed to update order', 'error')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleDeleteOrder = async (id) => {
    requestConfirm('Delete Order', 'Are you sure you want to delete this order?', async () => {
      const removedOrder = orders.find(item => item._id === id)
      setOrders(prev => prev.filter(item => item._id !== id))
      try {
        await orderApi.delete(id)
        addToast('Order deleted', 'success')
      } catch (err) {
        if (removedOrder) setOrders(prev => [removedOrder, ...prev])
        addToast(err.response?.data?.message || 'Failed to delete order', 'error')
      }
    })
  }

  const handleSaveUser = async () => {
    if (!userForm.name.trim()) {
      addToast('User name is required', 'error')
      return
    }
    if (!/^\d{10}$/.test(userForm.phone)) {
      addToast('Enter a valid 10-digit phone number', 'error')
      return
    }
    if (userForm.secondaryPhone && !/^\d{10}$/.test(userForm.secondaryPhone)) {
      addToast('Enter a valid 10-digit secondary phone number', 'error')
      return
    }
    if (userModalId === 'new' && userForm.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }
    if (userModalId !== 'new' && userForm.password && userForm.password.length < 6) {
      addToast('Password must be at least 6 characters', 'error')
      return
    }
    if (!userForm.pinCode) {
      addToast('Pin Code is required', 'error')
      return
    }
    if (userForm.pinCode.length !== 6) {
      addToast('Pin Code must be 6 digits', 'error')
      return
    }

    const payload = {
      name: userForm.name,
      phone: userForm.phone,
      secondaryPhone: userForm.secondaryPhone,
      gstNumber: userForm.gstNumber,
      pinCode: userForm.pinCode,
      address: userForm.address,
      role: userForm.role,
      isBlocked: userForm.isBlocked,
    }
    if (userForm.password) payload.password = userForm.password

    setSavingUser(true)
    const currentUserId = userModalId
    const previousUser = users.find(item => item._id === currentUserId)
    const tempId = `temp-user-${Date.now()}`
    try {
      if (currentUserId === 'new') {
        const optimisticUser = {
          ...payload,
          _id: tempId,
          orderCount: 0,
          isAdmin: ['staff', 'admin'].includes(payload.role),
          pending: true,
        }
        setUsers(prev => [optimisticUser, ...prev])
        setUserModalId(null)
        setUserForm(EMPTY_USER)
        const res = await adminApi.createUser(payload)
        setUsers(prev => prev.map(item => item._id === tempId ? res.data.user : item))
        addToast('User created', 'success')
      } else {
        setUsers(prev => prev.map(item => item._id === currentUserId ? { ...item, ...payload, pending: true } : item))
        setUserModalId(null)
        setUserForm(EMPTY_USER)
        const res = await adminApi.updateUser(currentUserId, payload)
        setUsers(prev => prev.map(item => item._id === currentUserId ? res.data.user : item))
        addToast('User updated', 'success')
      }
    } catch (err) {
      if (currentUserId === 'new') {
        setUsers(prev => prev.filter(item => item._id !== tempId))
      } else if (previousUser) {
        setUsers(prev => prev.map(item => item._id === currentUserId ? previousUser : item))
      }
      addToast(err.response?.data?.message || 'Failed to save user', 'error')
    } finally {
      setSavingUser(false)
    }
  }

  const statItems = [
    { label: 'Orders', value: stats?.orders ?? orders.length, icon: ClipboardList },
    { label: 'Pending', value: stats?.pending ?? orders.filter(item => item.status === 'pending').length, icon: ClipboardList },
    { label: 'Products', value: stats?.products ?? products.length, icon: Package },
    { label: 'Users', value: stats?.users ?? users.length, icon: Users },
  ]

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'orders', label: 'Orders', icon: ClipboardList },
    { key: 'products', label: 'Products', icon: Package },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <div className="admin-page-shell" style={{ minHeight: '100vh', background: 'var(--cream)', color: 'var(--text-dark)', paddingBottom: '32px' }}>
      <header className="admin-topbar" style={{ background: 'linear-gradient(135deg, #7C2D12, #C2410C, #EA580C)', position: 'sticky', top: 0, zIndex: 40, paddingTop: '24px' }}>
        <div className="admin-topbar-inner" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate('/')}
            aria-label="Back"
            style={iconButtonStyle('rgba(255,255,255,0.2)', '#FFFFFF')}
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1, minWidth: 0, color: 'white' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.5px' }}>Admin <span style={{ color: 'var(--amber)' }}>Panel</span></div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>SVT Oils Management</div>
          </div>
          <button onClick={fetchAll} disabled={loading} style={iconButtonStyle('rgba(255,255,255,0.2)', '#FFFFFF')} title="Refresh">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path></svg>
          </button>
          <button onClick={handleLogout} style={iconButtonStyle('rgba(255,255,255,0.2)', '#FFFFFF')} title="Logout">
            <LogOut size={18} />
          </button>
        </div>

        <nav className="admin-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', background: 'white', borderRadius: '20px 20px 0 0', overflow: 'hidden', boxShadow: '0 -4px 10px rgba(0,0,0,0.05)' }}>
          {tabs.map(item => {
            const Icon = item.icon
            const active = tab === item.key
            return (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                style={{
                  minWidth: 0,
                  padding: '12px 4px',
                  border: 'none',
                  borderBottom: active ? '3px solid var(--saffron)' : '3px solid transparent',
                  background: active ? 'var(--saffron-light)' : '#FFFFFF',
                  color: active ? 'var(--saffron-dark)' : 'var(--text-light)',
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} style={{ display: 'block', margin: '0 auto 4px' }} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="admin-main" style={{ padding: '14px', maxWidth: '1100px', margin: '0 auto' }}>
        {tab === 'dashboard' && (
          <section>
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* 1. Revenue Hero Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #15803D, #16A34A)',
                  borderRadius: '16px', padding: '24px', color: 'white',
                  boxShadow: '0 8px 20px rgba(22, 163, 74, 0.25)', position: 'relative', overflow: 'hidden'
                }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, opacity: 0.9 }}>Total Sales Revenue</div>
                    <div style={{ fontSize: '2.4rem', fontWeight: 900, marginTop: '4px', letterSpacing: '-1px' }}>
                      {formatPrice(stats?.revenue || 0)}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '4px' }}>All-time successful orders</div>
                  </div>
                  <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '8rem', opacity: 0.1, zIndex: 1, pointerEvents: 'none' }}>
                    💰
                  </div>
                </div>

                {/* 2. Pending Orders Alert */}
                {stats?.pending > 0 && (
                  <div style={{
                    background: '#FEF2F2', border: '2px solid #FECACA', borderRadius: '12px', padding: '16px',
                    display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                  }} onClick={() => { setStatusFilter('pending'); setTab('orders'); }}>
                    <div style={{ background: '#EF4444', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      ⚠️
                    </div>
                    <div>
                      <div style={{ color: '#991B1B', fontWeight: 900, fontSize: '1.05rem' }}>Attention Required!</div>
                      <div style={{ color: '#B91C1C', fontSize: '0.85rem', marginTop: '2px' }}>
                        You have {stats.pending} pending order{stats.pending > 1 ? 's' : ''} waiting to be confirmed. Tap here to view.
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Metric Cards */}
                <div style={gridStyle}>
                  <div style={{ ...panelStyle, borderTop: '4px solid #3B82F6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#3B82F6', fontSize: '0.85rem', fontWeight: 800 }}>Total Orders</span>
                      <ClipboardList size={20} color="#3B82F6" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#1E3A8A' }}>{stats?.orders ?? orders.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>All orders placed</div>
                  </div>

                  <div style={{ ...panelStyle, borderTop: '4px solid #F59E0B' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#F59E0B', fontSize: '0.85rem', fontWeight: 800 }}>Products</span>
                      <Package size={20} color="#F59E0B" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#78350F' }}>{stats?.products ?? products.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>Items in catalog</div>
                  </div>

                  <div style={{ ...panelStyle, borderTop: '4px solid #8B5CF6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#8B5CF6', fontSize: '0.85rem', fontWeight: 800 }}>Users</span>
                      <Users size={20} color="#8B5CF6" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, marginTop: '8px', color: '#4C1D95' }}>{stats?.users ?? users.length}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '4px' }}>Registered accounts</div>
                  </div>
                </div>

                {/* 4. Enhanced Recent Orders */}
                <div style={panelStyle}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-dark)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📦 Recent Orders
                  </div>
                  {(stats?.recentOrders || []).length === 0 ? (
                    <EmptyText text="No recent orders yet." />
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {stats.recentOrders.map(order => (
                        <div key={order._id} style={{
                          border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px',
                          display: 'flex', flexDirection: 'column', gap: '8px', background: '#FAFAFA'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>#{order.orderId || order._id?.slice(-6)?.toUpperCase()}</div>
                              <div style={{ fontSize: '0.8rem', color: '#4B5563', marginTop: '2px' }}>
                                {order.user?.name || 'Unknown User'} | +91 {order.phone || order.user?.phone || ''}
                              </div>
                            </div>
                            <StatusBadge status={order.status} />
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: '#6B7280', background: '#F3F4F6', padding: '8px', borderRadius: '6px' }}>
                            {order.items?.map(item => `${item.name} x${item.qty}`).join(', ') || 'No items'}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{formatDate(order.createdAt)}</div>
                            <div style={{ fontWeight: 900, color: order.hasNegotiable ? '#7C3AED' : '#15803D', fontSize: '1.05rem' }}>
                              {order.hasNegotiable ? 'Negotiable' : formatPrice(order.total || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setStatusFilter('all'); setTab('orders'); }}
                    style={{ ...secondaryButtonStyle, width: '100%', marginTop: '16px', padding: '12px' }}
                  >
                    View All Orders →
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'orders' && (
          <section>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {['all', ...STATUS_OPTIONS].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  style={{
                    ...chipStyle,
                    background: statusFilter === status ? 'var(--saffron)' : '#FFFFFF',
                    color: statusFilter === status ? '#FFFFFF' : 'var(--text-mid)',
                    borderColor: statusFilter === status ? 'var(--saffron)' : 'var(--border)',
                  }}
                >
                  {status === 'all' ? 'All' : STATUS_LABELS[status]}
                </button>
              ))}
            </div>
            {loading ? (
              <AdminListSkeleton count={6} />
            ) : filteredOrders.length === 0 ? (
              <EmptyText text="No orders found." />
            ) : (
              <div className="admin-card-grid" style={{ display: 'grid', gap: '10px' }}>
                {filteredOrders.map(order => (
                  <div key={order._id} style={{ ...panelStyle, opacity: order.pending ? 0.65 : 1 }}>
                    <OrderRow order={order} />
                    <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#4B5563' }}>
                      {order.items?.map(item => `${item.name} x${item.qty}`).join(', ')}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#6B7280' }}>
                      Shop Name: {order.deliveryAddress || order.user?.address || 'Not provided'}
                    </div>
                    {order.user?.gstNumber && (
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
                        GST Number: <span style={{ color: '#0284C7' }}>{order.user.gstNumber}</span>
                      </div>
                    )}
                    {order.user?.pinCode && (
                      <div style={{ marginTop: '4px', fontSize: '0.78rem', color: '#6B7280', fontWeight: 600 }}>
                        Pin Code: <span style={{ color: '#F59E0B' }}>{order.user.pinCode}</span>
                      </div>
                    )}
                    {Number.isFinite(order.deliveryLocation?.lat) && Number.isFinite(order.deliveryLocation?.lng) && (
                      <a
                        href={`https://www.google.com/maps?q=${order.deliveryLocation.lat},${order.deliveryLocation.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#2563EB', fontSize: '0.78rem', fontWeight: 900, textDecoration: 'none' }}
                      >
                        Open map location <ExternalLink size={13} />
                      </a>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                      <StatusBadge status={order.status} />
                      <div style={{ flex: 1 }} />
                      <select
                        value={order.status}
                        disabled={updatingOrderId === order._id}
                        onChange={event => handleUpdateStatus(order._id, event.target.value)}
                        style={selectStyle}
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                      <button onClick={() => handleDeleteOrder(order._id)} aria-label="Delete order" style={iconButtonStyle('#FEE2E2', 'var(--red-badge)')}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'products' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
              <button onClick={() => openProductModal()} style={primaryButtonStyle}>
                <Plus size={18} /> Add Product
              </button>
            </div>
            {loading ? (
              <AdminListSkeleton count={6} withImage />
            ) : products.length === 0 ? (
              <EmptyText text="No products found. Add your first product." />
            ) : (
              <div className="admin-card-grid" style={{ display: 'grid', gap: '10px' }}>
                {products.map(product => (
                  <div key={product._id} style={{ ...panelStyle, display: 'flex', gap: '12px', alignItems: 'center', opacity: product.pending ? 0.65 : 1 }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: 'var(--saffron-light)', color: 'var(--saffron-dark)', display: 'grid', placeItems: 'center', fontWeight: 900, overflow: 'hidden', flexShrink: 0 }}>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        product.brand?.slice(0, 2)?.toUpperCase() || 'SV'
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, lineHeight: 1.2, marginBottom: '2px', wordBreak: 'break-word' }}>{product.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-mid)' }}>{getProductMetaLabel(product)}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 800, color: getProductPriceLabel(product) === 'Negotiable' ? 'var(--saffron-dark)' : 'var(--text-dark)' }}>
                          {getProductPriceLabel(product)}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-mid)', background: '#F5F5F4', padding: '1px 6px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                          Priority: {product.sortOrder ?? 999}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => openProductModal(product)} aria-label="Edit product" style={iconButtonStyle('var(--saffron-light)', 'var(--saffron-dark)')}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product._id)} aria-label="Delete product" style={iconButtonStyle('#FEE2E2', 'var(--red-badge)')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <div style={{ ...panelStyle, padding: '0 10px', flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={17} color="#6B7280" />
                <input
                  value={userSearch}
                  onChange={event => setUserSearch(event.target.value)}
                  placeholder="Search users"
                  style={{ border: 'none', outline: 'none', flex: 1, padding: '12px 0', fontFamily: 'Baloo 2, sans-serif', background: 'transparent' }}
                />
              </div>
              <button onClick={() => openUserModal()} style={primaryButtonStyle}>
                <Plus size={18} /> User
              </button>
            </div>

            {loading ? (
              <AdminListSkeleton count={6} withAvatar />
            ) : filteredUsers.length === 0 ? (
              <EmptyText text="No users found." />
            ) : (
              <div className="admin-card-grid" style={{ display: 'grid', gap: '10px' }}>
                {filteredUsers.map(item => (
                  <div key={item._id} style={{ ...panelStyle, display: 'flex', gap: '12px', alignItems: 'center', opacity: item.pending ? 0.65 : 1 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--saffron-light)', color: 'var(--saffron-dark)', display: 'grid', placeItems: 'center', fontWeight: 900 }}>
                      {item.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-mid)' }}>
                        +91 {item.phone}
                        {item.secondaryPhone ? ` | +91 ${item.secondaryPhone}` : ''}
                        {item.gstNumber ? ` | GST: ${item.gstNumber}` : ''}
                        {item.pinCode ? ` | PIN: ${item.pinCode}` : ''}
                        {` | ${item.role || 'customer'}`}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.address || 'No shop name'}
                      </div>
                    </div>
                    <button onClick={() => openUserModal(item)} aria-label="Edit user" style={iconButtonStyle('var(--saffron-light)', 'var(--saffron-dark)')}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteUser(item._id)} aria-label="Delete user" style={iconButtonStyle('#FEE2E2', 'var(--red-badge)')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'settings' && (
          <section>
            <div style={{ ...panelStyle, maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚙️</span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>System Settings</h2>
              </div>

              <div style={{ display: 'grid', gap: '20px' }}>
                <Field label="Bulk Orders Phone Number">
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="Enter phone number for bulk orders"
                    value={settingsForm.bulkOrderPhone}
                    onChange={event => setSettingsForm(prev => ({ ...prev, bulkOrderPhone: event.target.value }))}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>
                    Replicates on the home banner: "Bulk Orders? Call: [number]"
                  </div>
                </Field>

                <Field label="Support / Issues Phone Number">
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="Enter phone number for customer issues"
                    value={settingsForm.supportPhone}
                    onChange={event => setSettingsForm(prev => ({ ...prev, supportPhone: event.target.value }))}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '4px' }}>
                    Replicates on the home banner: "Having Issues? Call Support: [number]"
                  </div>
                </Field>

                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    style={{ ...primaryButtonStyle, width: '100%', padding: '12px' }}
                  >
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {productModalId && (
        <Modal onClose={() => setProductModalId(null)} title={productModalId === 'new' ? 'Add Product' : 'Edit Product'}>
          <Field label="Product Name">
            <input className="input-field" value={productForm.name} onChange={event => setProductForm(prev => ({ ...prev, name: event.target.value }))} />
          </Field>
          <Field label="Brand">
            <input className="input-field" value={productForm.brand} onChange={event => setProductForm(prev => ({ ...prev, brand: event.target.value }))} />
          </Field>
          <Field label="Product Image URL">
            <input className="input-field" placeholder="https://example.com/product.png" value={productForm.imageUrl} onChange={event => setProductForm(prev => ({ ...prev, imageUrl: event.target.value }))} />
          </Field>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ ...secondaryButtonStyle, width: 'fit-content' }}>
              {uploadingProductImage ? 'Uploading...' : 'Upload image'}
              <input type="file" accept="image/*" onChange={handleUploadProductImage} disabled={uploadingProductImage} style={{ display: 'none' }} />
            </label>
            {productForm.imageUrl && (
              <div style={{ width: '140px', height: '100px', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#F9FAFB' }}>
                <img src={productForm.imageUrl} alt="Product preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Category">
              <select className="input-field" value={productForm.category} onChange={event => setProductForm(prev => ({ ...prev, category: event.target.value }))}>
                {['vegetable', 'sunflower', 'palm', 'groundnut', 'safflower', 'coconut', 'mustard', 'soybean', 'lamp', 'other'].map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Weight">
              <input className="input-field" value={productForm.weight} onChange={event => setProductForm(prev => ({ ...prev, weight: event.target.value }))} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Field label="Price">
              <input className="input-field" type="number" value={productForm.price} placeholder="Blank = negotiable" onChange={event => setProductForm(prev => ({ ...prev, price: event.target.value, isNegotiable: event.target.value === '' ? true : prev.isNegotiable }))} />
            </Field>
            <Field label="Discount Price">
              <input className="input-field" type="number" value={productForm.discountPrice} onChange={event => setProductForm(prev => ({ ...prev, discountPrice: event.target.value }))} />
            </Field>
          </div>
          <Field label="Display Priority (Lower number shows first)">
            <input className="input-field" type="number" value={productForm.sortOrder} onChange={event => setProductForm(prev => ({ ...prev, sortOrder: event.target.value }))} />
          </Field>
          <label style={checkboxStyle}>
            <input type="checkbox" checked={productForm.isNegotiable || productForm.price === ''} disabled={productForm.price === ''} onChange={event => setProductForm(prev => ({ ...prev, isNegotiable: event.target.checked }))} />
            Negotiable price
          </label>
          <label style={checkboxStyle}>
            <input type="checkbox" checked={productForm.inStock} onChange={event => setProductForm(prev => ({ ...prev, inStock: event.target.checked }))} />
            In stock
          </label>
          <label style={checkboxStyle}>
            <input type="checkbox" checked={productForm.isNew} onChange={event => setProductForm(prev => ({ ...prev, isNew: event.target.checked }))} />
            Mark as new
          </label>
          <div style={variantSectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, color: '#111827' }}>Weights / variants</div>
                <div style={{ fontSize: '0.76rem', color: '#6B7280' }}>
                  Add all sizes for this product here.
                </div>
              </div>
            </div>
            {(productForm.variants || []).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#6B7280', padding: '8px 0' }}>
                No variants added. The single weight and price above will be used.
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {productForm.variants.map((variant, index) => (
                  <div key={index} className="variant-row" style={variantRowStyle}>
                    <Field label="Weight">
                      <input
                        className="input-field"
                        placeholder="800GM"
                        value={variant.weight}
                        onChange={event => handleUpdateVariant(index, { weight: event.target.value })}
                      />
                    </Field>
                    <Field label="Price">
                      <input
                        className="input-field"
                        type="number"
                        placeholder="Blank = negotiable"
                        value={variant.price}
                        onChange={event => handleUpdateVariant(index, {
                          price: event.target.value,
                          isNegotiable: event.target.value === '' ? true : variant.isNegotiable,
                        })}
                      />
                    </Field>
                    <Field label="Discount">
                      <input
                        className="input-field"
                        type="number"
                        value={variant.discountPrice}
                        onChange={event => handleUpdateVariant(index, { discountPrice: event.target.value })}
                      />
                    </Field>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label style={checkboxStyle}>
                        <input
                          type="checkbox"
                          checked={variant.isNegotiable || variant.price === ''}
                          disabled={variant.price === ''}
                          onChange={event => handleUpdateVariant(index, { isNegotiable: event.target.checked })}
                        />
                        Negotiable
                      </label>
                      <label style={checkboxStyle}>
                        <input
                          type="checkbox"
                          checked={variant.inStock !== false}
                          onChange={event => handleUpdateVariant(index, { inStock: event.target.checked })}
                        />
                        Stock
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(index)}
                      aria-label="Remove weight"
                      style={iconButtonStyle('#FEE2E2', '#DC2626')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="button" onClick={handleAddVariant} style={secondaryButtonStyle}>
                <Plus size={16} /> Weight
              </button>
            </div>
          </div>
          <Field label="Description">
            <textarea className="input-field" rows={3} value={productForm.description} onChange={event => setProductForm(prev => ({ ...prev, description: event.target.value }))} />
          </Field>
          <div style={modalActionsStyle}>
            <button onClick={() => setProductModalId(null)} style={secondaryButtonStyle}><X size={17} /> Cancel</button>
            <button onClick={handleSaveProduct} disabled={savingProduct} style={primaryButtonStyle}><Save size={17} /> Save</button>
          </div>
        </Modal>
      )}

      {userModalId && (
        <Modal onClose={() => setUserModalId(null)} title={userModalId === 'new' ? 'Create User' : 'Edit User'}>
          <Field label="Name">
            <input className="input-field" value={userForm.name} onChange={event => setUserForm(prev => ({ ...prev, name: event.target.value }))} />
          </Field>
          <Field label="Primary Phone">
            <input className="input-field" value={userForm.phone} inputMode="numeric" maxLength={10} onChange={event => setUserForm(prev => ({ ...prev, phone: event.target.value.replace(/\D/g, '').slice(0, 10) }))} />
          </Field>
          <Field label="Secondary Phone (Optional)">
            <input className="input-field" value={userForm.secondaryPhone || ''} inputMode="numeric" maxLength={10} onChange={event => setUserForm(prev => ({ ...prev, secondaryPhone: event.target.value.replace(/\D/g, '').slice(0, 10) }))} />
          </Field>
          <Field label="GST Number (Optional)">
            <input className="input-field" value={userForm.gstNumber || ''} placeholder="e.g. 22AAAAA0000A1Z5" maxLength={15} onChange={event => setUserForm(prev => ({ ...prev, gstNumber: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') }))} />
          </Field>
          <Field label="Pin Code">
            <input className="input-field" value={userForm.pinCode || ''} placeholder="e.g. 570001" maxLength={6} inputMode="numeric" onChange={event => setUserForm(prev => ({ ...prev, pinCode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} />
          </Field>
          <Field label={userModalId === 'new' ? 'Password' : 'New Password'}>
            <PasswordInput
              value={userForm.password}
              show={showUserPassword}
              placeholder={userModalId === 'new' ? 'Minimum 6 characters' : 'Leave blank to keep same'}
              autoComplete={userModalId === 'new' ? 'new-password' : 'off'}
              onToggle={() => setShowUserPassword(value => !value)}
              onChange={event => setUserForm(prev => ({ ...prev, password: event.target.value }))}
            />
          </Field>
          <Field label="Role">
            <select className="input-field" value={userForm.role} onChange={event => setUserForm(prev => ({ ...prev, role: event.target.value }))}>
              <option value="customer">customer</option>
              <option value="staff">staff</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          <Field label="Shop Name / Address">
            <textarea className="input-field" rows={3} value={userForm.address} onChange={event => setUserForm(prev => ({ ...prev, address: event.target.value }))} />
          </Field>
          <label style={checkboxStyle}>
            <input type="checkbox" checked={userForm.isBlocked} onChange={event => setUserForm(prev => ({ ...prev, isBlocked: event.target.checked }))} />
            Block this user
          </label>
          <div style={modalActionsStyle}>
            <button onClick={() => setUserModalId(null)} style={secondaryButtonStyle}><X size={17} /> Cancel</button>
            <button onClick={handleSaveUser} disabled={savingUser} style={primaryButtonStyle}><Save size={17} /> Save</button>
          </div>
        </Modal>
      )}

      {confirmDialog && (
        <div className="modal-overlay" style={{ alignItems: 'center', padding: '24px' }} onClick={() => setConfirmDialog(null)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '360px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: 900, color: '#111827' }}>{confirmDialog.title}</h3>
            <p style={{ margin: '0 0 24px', fontSize: '0.95rem', color: '#4B5563', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDialog(null)} style={{ ...secondaryButtonStyle, border: '1px solid #D1D5DB', color: '#374151', padding: '8px 16px' }}>Cancel</button>
              <button onClick={confirmDialog.onConfirm} style={{ ...primaryButtonStyle, background: '#DC2626', padding: '8px 16px', boxShadow: 'none' }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderRow({ order, compact = false }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: compact ? 'center' : 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900 }}>{order.orderId || order._id?.slice(-6)?.toUpperCase()}</div>
        <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
          {order.user?.name || 'Unknown user'} | +91 {order.phone || order.user?.phone || ''}
        </div>
        {!compact && <div style={{ fontSize: '0.76rem', color: '#9CA3AF', marginTop: '2px' }}>{formatDate(order.createdAt)}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontWeight: 900, color: order.hasNegotiable ? '#7C3AED' : '#15803D' }}>
          {order.hasNegotiable ? 'Negotiable' : formatPrice(order.total || 0)}
        </div>
        {compact && <StatusBadge status={order.status} />}
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span style={{
      display: 'inline-block',
      borderRadius: '999px',
      padding: '4px 10px',
      fontSize: '0.72rem',
      fontWeight: 900,
      background: `${STATUS_COLORS[status] || '#6B7280'}18`,
      color: STATUS_COLORS[status] || '#6B7280',
      whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function EmptyText({ text }) {
  return (
    <div style={{ padding: '36px 12px', textAlign: 'center', color: '#6B7280', fontWeight: 700 }}>
      {text}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div style={gridStyle}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-panel">
            <div className="skeleton skeleton-line" style={{ width: '54%', marginBottom: '14px' }} />
            <div className="skeleton skeleton-line" style={{ width: '34%', height: '24px' }} />
          </div>
        ))}
      </div>
      <div className="skeleton-panel" style={{ marginTop: '12px' }}>
        <div className="skeleton skeleton-line" style={{ width: '18%', marginBottom: '14px' }} />
        <div className="skeleton skeleton-line" style={{ width: '28%', height: '28px' }} />
      </div>
      <AdminListSkeleton count={3} />
    </>
  )
}

function AdminListSkeleton({ count = 4, withImage = false, withAvatar = false }) {
  return (
    <div className="admin-card-grid" style={{ display: 'grid', gap: '10px' }}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-panel" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {(withImage || withAvatar) && (
            <div
              className="skeleton"
              style={{
                width: withAvatar ? '44px' : '56px',
                height: withAvatar ? '44px' : '56px',
                borderRadius: withAvatar ? '50%' : '8px',
                flexShrink: 0,
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: '68%', marginBottom: '9px' }} />
            <div className="skeleton skeleton-line" style={{ width: '46%', marginBottom: '9px' }} />
            <div className="skeleton skeleton-line" style={{ width: '82%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={event => event.stopPropagation()}>
        <div className="modal-handle" />
        <div style={{ padding: '4px 20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', gap: '10px' }}>
            <h2 style={{ margin: 0, flex: 1, fontSize: '1.12rem', fontWeight: 900 }}>{title}</h2>
            <button onClick={onClose} aria-label="Close" style={iconButtonStyle('var(--border)', 'var(--text-dark)')}>
              <X size={18} />
            </button>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: '5px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-mid)' }}>
      {label}
      {children}
    </label>
  )
}

function PasswordInput({ value, show, placeholder, autoComplete, onToggle, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        className="input-field"
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        onChange={onChange}
        style={{ paddingRight: '48px' }}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
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
          color: '#6B7280',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

const panelStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '14px',
  boxShadow: 'var(--shadow-sm)',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '12px',
}

const labelStyle = {
  color: 'var(--text-mid)',
  fontSize: '0.8rem',
  fontWeight: 700,
}

const sectionHeaderStyle = {
  fontSize: '1rem',
  fontWeight: 800,
  color: 'var(--text-dark)',
}

const primaryButtonStyle = {
  border: 'none',
  borderRadius: '50px',
  padding: '10px 18px',
  background: 'linear-gradient(135deg, var(--saffron-dark), var(--saffron))',
  color: '#FFFFFF',
  fontFamily: 'var(--font-main)',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
}

const secondaryButtonStyle = {
  border: '2px solid var(--saffron)',
  borderRadius: '50px',
  padding: '8px 16px',
  background: '#FFFFFF',
  color: 'var(--saffron-dark)',
  fontFamily: 'var(--font-main)',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
}

const iconButtonStyle = (background, color) => ({
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  border: 'none',
  background,
  color,
  cursor: 'pointer',
  display: 'inline-grid',
  placeItems: 'center',
  flexShrink: 0,
})

const chipStyle = {
  border: '2px solid var(--border)',
  borderRadius: '50px',
  padding: '6px 16px',
  fontFamily: 'var(--font-main)',
  fontWeight: 700,
  fontSize: '0.8rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'all 0.2s',
}

const selectStyle = {
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  background: '#FFFFFF',
  fontFamily: 'var(--font-main)',
  fontWeight: 700,
  color: 'var(--text-dark)',
  outline: 'none',
}

const checkboxStyle = {
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  color: 'var(--text-mid)',
  fontWeight: 700,
  fontSize: '0.9rem',
}

const variantSectionStyle = {
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '14px',
  background: 'var(--warm-white)',
  display: 'grid',
  gap: '12px',
}

const variantRowStyle = {
  border: '2px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '12px',
  background: '#FFFFFF',
  display: 'grid',
  gap: '10px',
  alignItems: 'end',
}

const modalActionsStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  marginTop: '8px',
}
