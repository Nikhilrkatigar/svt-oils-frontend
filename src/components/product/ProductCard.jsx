import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'

// Emoji map by category
const CATEGORY_EMOJI = {
  sunflower: '🌻',
  groundnut: '🥜',
  palm: '🌴',
  coconut: '🥥',
  mustard: '🌿',
  soybean: '🫘',
  safflower: '🌸',
  vegetable: '🍀',
  lamp: '🪔',
  default: '🫙',
}

const getCategoryEmoji = (category = '') => {
  const key = Object.keys(CATEGORY_EMOJI).find(k =>
    category.toLowerCase().includes(k)
  )
  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI.default
}

const formatPrice = (price) => {
  if (!price && price !== 0) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(price)
}

const parseQty = (value) => {
  const qty = Number.parseInt(value, 10)
  if (!Number.isFinite(qty) || qty < 0) return 0
  return Math.min(qty, 9999)
}

export default function ProductCard({ product, onClick }) {
  const { getQty, addItem, updateQty } = useCart()
  const addToast = useToast()
  const variants = product.variants?.length ? product.variants : []
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?._id || '')
  const selectedVariant = variants.find(v => v._id === selectedVariantId) || null
  const activeProduct = selectedVariant ? {
    ...product,
    _id: selectedVariant.productId || product._id,
    weight: selectedVariant.weight,
    price: selectedVariant.price,
    discountPrice: selectedVariant.discountPrice,
    isNegotiable: selectedVariant.isNegotiable,
    inStock: selectedVariant.inStock,
    variantId: selectedVariant._id,
    cartKey: `${product._id}:${selectedVariant._id}`,
  } : product
  const activeKey = activeProduct.cartKey || activeProduct._id
  const qty = getQty(activeKey)
  const [justAdded, setJustAdded] = useState(false)

  const hasDiscount = activeProduct.discountPrice != null && activeProduct.discountPrice < activeProduct.price
  const displayPrice = hasDiscount ? activeProduct.discountPrice : activeProduct.price
  const discountPct = hasDiscount
    ? Math.round(((activeProduct.price - activeProduct.discountPrice) / activeProduct.price) * 100)
    : 0

  const handleAdd = (e) => {
    e.stopPropagation()
    if (activeProduct.inStock === false) return
    addItem(activeProduct)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1000)
    addToast(`${product.name} added! 🛒`, 'cart')
  }

  const handleQty = (e, newQty) => {
    e.stopPropagation()
    updateQty(activeKey, newQty)
  }

  const handleQtyInput = (e) => {
    e.stopPropagation()
    updateQty(activeKey, parseQty(e.target.value))
  }

  return (
    <div className="product-card" onClick={onClick}>
      {/* Image area */}
      <div className="product-img-wrap">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: '2.8rem' }}>
            {product.emoji || getCategoryEmoji(product.category)}
          </span>
        )}
        {/* Badges */}
        <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {product.isNew && (
            <span className="badge-new" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>NEW</span>
          )}
          {hasDiscount && (
            <span className="badge-discount" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
              -{discountPct}%
            </span>
          )}
          {activeProduct.isNegotiable && !hasDiscount && (
            <span className="badge-negotiable" style={{ fontSize: '0.62rem', padding: '2px 7px' }}>
              NEGO
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="product-info">
        <div className="product-brand">{product.brand || product.category}</div>
        <div className="product-name">{product.name}</div>
        {variants.length > 0 && (
          <select
            className="variant-select"
            value={selectedVariantId}
            onClick={e => e.stopPropagation()}
            onChange={e => setSelectedVariantId(e.target.value)}
            aria-label={`Select weight for ${product.name}`}
          >
            {variants.map(variant => (
              <option key={variant._id} value={variant._id}>{variant.weight}</option>
            ))}
          </select>
        )}

        {/* Price */}
        <div className="product-price-row">
          {activeProduct.isNegotiable && !activeProduct.price ? (
            <span style={{
              fontSize: '0.82rem', fontWeight: '800',
              background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Negotiable 🤝
            </span>
          ) : (
            <>
              {hasDiscount && (
                <span className="price-scratch" style={{ fontSize: '0.78rem' }}>
                  {formatPrice(activeProduct.price)}
                </span>
              )}
              <span className={`price-main ${hasDiscount ? 'discounted' : ''}`}>
                {formatPrice(displayPrice)}
              </span>
            </>
          )}
        </div>

        {/* Quantity control */}
        {activeProduct.inStock === false ? (
          <button
            className="add-btn"
            disabled
            onClick={e => e.stopPropagation()}
            style={{ opacity: 0.55, cursor: 'not-allowed', background: '#9CA3AF' }}
          >
            Out of Stock
          </button>
        ) : qty === 0 ? (
          <button
            className="add-btn"
            onClick={handleAdd}
            style={justAdded ? { background: 'linear-gradient(135deg, #16A34A, #22C55E)' } : {}}
          >
            {justAdded ? '✓ Added' : '+ Add'}
          </button>
        ) : (
          <div className="qty-control">
            <button className="qty-btn" onClick={e => handleQty(e, qty - 1)}>−</button>
            <input
              className="qty-input"
              type="number"
              min="0"
              max="9999"
              value={qty}
              onClick={e => e.stopPropagation()}
              onChange={handleQtyInput}
              aria-label={`Quantity for ${product.name}`}
            />
            <button className="qty-btn" onClick={e => handleQty(e, qty + 1)}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}
