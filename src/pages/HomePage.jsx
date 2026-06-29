import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { productApi, settingsApi } from '../utils/api'
import ProductCard from '../components/product/ProductCard'
import ProductDetail from '../components/product/ProductDetail'
import BottomNav from '../components/layout/BottomNav'

// Banners are dynamically constructed inside the component based on settings

// Demo products (used as fallback when API is not connected)
const DEMO_PRODUCTS = [
  { _id: 'd1', name: 'SVT Gold Veg Oil', brand: 'SVT GOLD', category: 'vegetable', weight: '1 Ltr', price: 1675, isNew: true, inStock: true, emoji: '🫙' },
  { _id: 'd2', name: 'SVT Gold Veg Oil', brand: 'SVT GOLD', category: 'vegetable', weight: '2 Ltr', price: 1685, inStock: true, emoji: '🫙' },
  { _id: 'd3', name: 'SVT Gold Veg Oil', brand: 'SVT GOLD', category: 'vegetable', weight: '5 Ltr', price: 1695, discountPrice: 1620, inStock: true, emoji: '🫙' },
  { _id: 'd4', name: 'SVT Gold HD Jar', brand: 'SVT GOLD', category: 'vegetable', weight: '15 Kg', price: 2200, inStock: true, emoji: '🏺' },
  { _id: 'd5', name: 'Sun Shudh Sunflower Oil', brand: 'SUNSHUDH', category: 'sunflower', weight: '800 Gm', price: 1459, inStock: true, emoji: '🌻' },
  { _id: 'd6', name: 'Sun Shudh Sunflower Oil', brand: 'SUNSHUDH', category: 'sunflower', weight: '1 Ltr', price: 1652, inStock: true, emoji: '🌻' },
  { _id: 'd7', name: 'Sun Shudh Sunflower Oil', brand: 'SUNSHUDH', category: 'sunflower', weight: '5 Ltr', price: 860, discountPrice: 820, inStock: true, emoji: '🌻' },
  { _id: 'd8', name: 'Sun Shudh Sunflower Oil', brand: 'SUNSHUDH', category: 'sunflower', weight: '15 Kg', price: 2759, inStock: true, emoji: '🌻' },
  { _id: 'd9', name: 'Sun Vijay Sunflower Oil', brand: 'SUN VIJAY', category: 'sunflower', weight: '750 Gm', price: 1293, inStock: true, emoji: '🌻' },
  { _id: 'd10', name: 'Sun Vijay Sunflower Oil', brand: 'SUN VIJAY', category: 'sunflower', weight: '800 Gm', price: 1376, inStock: true, emoji: '🌻' },
  { _id: 'd11', name: 'Sun Vijay Sunflower Oil', brand: 'SUN VIJAY', category: 'sunflower', weight: '15 Kg', price: 2621, discountPrice: 2550, inStock: true, emoji: '🌻' },
  { _id: 'd12', name: 'Geo Gold Palm Oil', brand: 'GEO GOLD', category: 'palm', weight: '750 Gm', price: 1221, inStock: true, emoji: '🌴' },
  { _id: 'd13', name: 'Geo Gold Palm Oil', brand: 'GEO GOLD', category: 'palm', weight: '790 Gm', price: 1283, inStock: true, emoji: '🌴' },
  { _id: 'd14', name: 'Geo Gold Palm Oil', brand: 'GEO GOLD', category: 'palm', weight: '15 Ltr', price: 2178, inStock: true, emoji: '🌴' },
  { _id: 'd15', name: 'Geo Gold Palm Oil', brand: 'GEO GOLD', category: 'palm', weight: '15 Kg', price: 2491, inStock: true, emoji: '🌴' },
  { _id: 'd16', name: 'Nutri Choice Oil', brand: 'NUTRI CHOICE', category: 'vegetable', weight: '1 Kg', price: 1665, inStock: true, emoji: '🍀' },
  { _id: 'd17', name: 'Nutri Choice Oil', brand: 'NUTRI CHOICE', category: 'vegetable', weight: '500 Gm', price: 1675, inStock: true, emoji: '🍀' },
  { _id: 'd18', name: 'Nutri Choice Oil', brand: 'NUTRI CHOICE', category: 'vegetable', weight: '4 Kg', price: 2797, discountPrice: 2700, inStock: true, emoji: '🍀' },
  { _id: 'd19', name: 'IRAAA Oil Pouch', brand: 'IRAAA', category: 'vegetable', weight: '700 Gm', price: 1161, inStock: true, emoji: '🫙' },
  { _id: 'd20', name: 'IRAAA Oil Pouch', brand: 'IRAAA', category: 'vegetable', weight: '800 Gm', price: 1316, inStock: true, emoji: '🫙' },
  { _id: 'd21', name: 'IRAAA Oil Pouch', brand: 'IRAAA', category: 'vegetable', weight: '900 Gm', price: 1474, inStock: true, emoji: '🫙' },
  { _id: 'd22', name: 'NC Plus Veg Oil Pouch', brand: 'NC PLUS', category: 'vegetable', weight: '700 Gm', price: 1167, inStock: true, emoji: '🍀' },
  { _id: 'd23', name: 'NC Plus Veg Oil Pouch', brand: 'NC PLUS', category: 'vegetable', weight: '1 Kg', price: 1640, inStock: true, emoji: '🍀' },
  { _id: 'd24', name: 'Groundnut Oil', brand: 'PREMIUM', category: 'groundnut', weight: '1 Ltr', price: 330, inStock: true, emoji: '🥜' },
  { _id: 'd25', name: 'Safflower Oil', brand: 'PREMIUM', category: 'safflower', weight: '1 Ltr', price: 334, inStock: true, emoji: '🌸' },
  { _id: 'd26', name: 'Safflower Oil', brand: 'PREMIUM', category: 'safflower', weight: '5 Ltr', price: 1660, inStock: true, emoji: '🌸' },
  { _id: 'd27', name: 'Deepam Lamp Oil', brand: 'DEEPAM', category: 'lamp', weight: '1 Ltr', price: 163, inStock: true, emoji: '🪔' },
  { _id: 'd28', name: 'Deepam Lamp Oil (Pet Bottle)', brand: 'DEEPAM', category: 'lamp', weight: '1 Ltr Pet', price: null, isNegotiable: true, inStock: true, emoji: '🪔' },
  { _id: 'd29', name: 'SVT 10Rs Pouch (140 pc box)', brand: 'SVT GOLD', category: 'vegetable', weight: '7.4g x 140', price: 1040, inStock: true, emoji: '🫙' },
]

const CATEGORIES = [
  { key: 'all', label: '🌟 All' },
  { key: 'sunflower', label: '🌻 Sunflower' },
  { key: 'vegetable', label: '🍀 Vegetable' },
  { key: 'palm', label: '🌴 Palm' },
  { key: 'groundnut', label: '🥜 Groundnut' },
  { key: 'safflower', label: '🌸 Safflower' },
  { key: 'lamp', label: '🪔 Lamp Oil' },
]

const normalizeGroupPart = (value = '') => value.toString().trim().toLowerCase().replace(/\s+/g, ' ')

const getGroupKey = (product) => [
  normalizeGroupPart(product.brand),
  normalizeGroupPart(product.name),
  normalizeGroupPart(product.category),
].join('|')

const collapseProductVariants = (list) => {
  const groups = new Map()
  list.forEach(product => {
    const key = getGroupKey(product)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(product)
  })

  return Array.from(groups.values()).map(group => {
    if (group.length === 1 && !group[0].variants?.length) return group[0]

    const base = group[0]
    const variants = group.flatMap(product => {
      if (product.variants?.length) {
        return product.variants.map(variant => ({
          ...variant,
          productId: product._id,
        }))
      }

      return [{
        _id: product._id,
        productId: product._id,
        weight: product.weight || 'Default',
        price: product.price ?? null,
        discountPrice: product.discountPrice ?? null,
        isNegotiable: product.price == null ? true : Boolean(product.isNegotiable),
        inStock: product.inStock !== false,
      }]
    }).filter(variant => variant.weight)

    return {
      ...base,
      weight: '',
      price: null,
      discountPrice: null,
      isNegotiable: variants.every(variant => variant.isNegotiable || variant.price == null),
      inStock: variants.some(variant => variant.inStock !== false),
      variants,
    }
  })
}

export default function HomePage() {
  const { user } = useAuth()
  const addToast = useToast()
  const [products, setProducts] = useState([])
  const [suggestedProducts, setSuggestedProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [settings, setSettings] = useState({ bulkOrderPhone: '', supportPhone: '' })

  useEffect(() => {
    fetchProducts()
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await settingsApi.get()
      setSettings(res.data || { bulkOrderPhone: '', supportPhone: '' })
    } catch (err) {
      console.error('Failed to fetch settings', err)
    }
  }

  useEffect(() => {
    if (user) fetchSuggested()
  }, [user])

  const fetchSuggested = async () => {
    try {
      const res = await productApi.getSuggested()
      setSuggestedProducts(collapseProductVariants(res.data.products || []))
    } catch (err) {
      console.error('Failed to fetch suggested', err)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await productApi.getAll({ limit: 100 })
      setProducts(res.data.products || [])
    } catch {
      // Use demo data when backend not connected
      setProducts(DEMO_PRODUCTS)
    } finally {
      setLoading(false)
    }
  }

  const groupedProducts = useMemo(() => collapseProductVariants(products), [products])

  const filtered = groupedProducts.filter(p => {
    const searchText = search.toLowerCase()
    const matchCat = category === 'all' || p.category?.toLowerCase().includes(category)
    const matchSearch = !search
      || p.name.toLowerCase().includes(searchText)
      || p.brand?.toLowerCase().includes(searchText)
      || p.variants?.some(variant =>
        variant.weight?.toLowerCase().includes(searchText) ||
        String(variant.price ?? '').includes(searchText)
      )
    return matchCat && matchSearch
  })

  // Get greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="page">
      {/* Header */}
      <div className="app-header">
        <div className="app-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <img
              src="/svt-logo.png"
              alt="SVT Gold"
              style={{ width: '76px', height: '48px', objectFit: 'contain', background: 'white', borderRadius: '8px', padding: '5px', flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
            <div className="app-logo">SVT <span>Oils</span> 🫙</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', marginTop: '1px' }}>
              {getGreeting()}, {firstName}! 👋
            </div>
            </div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)', borderRadius: '50%',
            width: '42px', height: '42px', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', fontWeight: '800', color: 'white'
          }}>
            {firstName[0]?.toUpperCase()}
          </div>
        </div>

        {/* Search */}
        <div className="search-wrap">
          <Search className="search-icon" size={18} />
          <input
            className="search-bar"
            placeholder="Search oils, brands..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Banners */}
      {(() => {
        const phoneToShow = settings.bulkOrderPhone || settings.supportPhone
        const bannersList = [
          { title: 'Fresh Stock Arrived! 🎉', sub: 'SVT Gold & Sunflower Oils', cls: 'orange' },
          { 
            title: 'Bulk Orders? / Issues', 
            sub: phoneToShow ? `Call for special pricing 📞 +91 ${phoneToShow}` : 'Call for special pricing 📞', 
            cls: 'yellow',
            phone: phoneToShow
          },
          { title: 'Pure & Natural 🌿', sub: 'Quality you can taste', cls: 'green' },
        ]

        return (
          <div className="banner-scroll">
            {bannersList.map((b, i) => {
              const content = (
                <>
                  <div className="banner-title">{b.title}</div>
                  <div className="banner-sub">{b.sub}</div>
                </>
              )

              if (b.phone) {
                return (
                  <a 
                    key={i} 
                    href={`tel:${b.phone}`} 
                    className={`banner-card ${b.cls || ''}`} 
                    style={{ ...b.style, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    {content}
                  </a>
                )
              }

              return (
                <div key={i} className={`banner-card ${b.cls || ''}`} style={b.style}>
                  {content}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Suggested Products */}
      {!search && suggestedProducts.length > 0 && (
        <div style={{ padding: '8px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            <span style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-dark)' }}>
              Suggested for {firstName}
            </span>
          </div>
          <div className="product-grid" style={{
            display: 'flex', overflowX: 'auto', paddingBottom: '8px', 
            margin: '0 -16px', padding: '0 16px 8px', gap: '12px', scrollSnapType: 'x mandatory'
          }}>
            {suggestedProducts.map(p => (
              <div key={p._id} style={{ minWidth: '160px', width: '160px', flexShrink: 0, scrollSnapAlign: 'start' }}>
                <ProductCard product={p} onClick={() => setSelectedProduct(p)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="category-scroll">
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`cat-pill ${category === cat.key ? 'active' : ''}`}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Section Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 10px' }}>
        <div className="section-title" style={{ padding: 0 }}>
          {category === 'all' ? '🛒 All Products' : `${CATEGORIES.find(c => c.key === category)?.label}`}
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-light)', fontWeight: '600' }}>
          {filtered.length} items
        </span>
      </div>

      {/* Products */}
      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="product-card skeleton-product-card">
              <div className="skeleton skeleton-product-image" />
              <div className="product-info">
                <div className="skeleton skeleton-line" style={{ width: '54%', marginBottom: '8px' }} />
                <div className="skeleton skeleton-line" style={{ width: '86%', marginBottom: '10px' }} />
                <div className="skeleton skeleton-line" style={{ width: '42%', marginBottom: '12px' }} />
                <div className="skeleton skeleton-line" style={{ height: '30px', borderRadius: '8px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="emoji">🔍</div>
          <h3>No products found</h3>
          <p>Try a different category or search term</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(p => (
            <ProductCard
              key={p._id}
              product={p}
              onClick={() => setSelectedProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <BottomNav />
    </div>
  )
}
