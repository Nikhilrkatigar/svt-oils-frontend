import { useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'

const CATEGORY_EMOJI = {
  sunflower: '🌻', groundnut: '🥜', palm: '🌴', coconut: '🥥',
  mustard: '🌿', soybean: '🫘', safflower: '🌸', vegetable: '🍀',
  lamp: '🪔', default: '🫙',
}
const getCategoryEmoji = (category = '') => {
  const key = Object.keys(CATEGORY_EMOJI).find(k => category.toLowerCase().includes(k))
  return CATEGORY_EMOJI[key] || CATEGORY_EMOJI.default
}

const formatPrice = (p) => p != null
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(p)
  : null

const parseQty = (value) => {
  const qty = Number.parseInt(value, 10)
  if (!Number.isFinite(qty) || qty < 0) return 0
  return Math.min(qty, 9999)
}

export default function ProductDetail({ product, onClose }) {
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
  const hasDiscount = activeProduct.discountPrice != null && activeProduct.discountPrice < activeProduct.price
  const displayPrice = hasDiscount ? activeProduct.discountPrice : activeProduct.price
  const discountPct = hasDiscount
    ? Math.round(((activeProduct.price - activeProduct.discountPrice) / activeProduct.price) * 100) : 0

  const handleAdd = () => {
    addItem(activeProduct)
    addToast(`${product.name} added to cart! 🛒`, 'cart')
  }

  const handleQtyInput = (e) => {
    updateQty(activeKey, parseQty(e.target.value))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />

        {/* Product image area */}
        <div style={{
          background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '5rem' }}>
              {product.emoji || getCategoryEmoji(product.category)}
            </span>
          )}
          {hasDiscount && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              background: '#EF4444', color: 'white',
              borderRadius: '20px', padding: '6px 12px',
              fontSize: '0.85rem', fontWeight: '800',
            }}>
              -{discountPct}% OFF
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '20px 20px 8px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#A8A29E', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {product.brand || product.category}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '12px' }}>
            {product.name}
          </h2>

          {variants.length > 0 && (
            <select
              className="variant-select"
              value={selectedVariantId}
              onChange={event => setSelectedVariantId(event.target.value)}
              aria-label={`Select weight for ${product.name}`}
              style={{ marginBottom: '14px' }}
            >
              {variants.map(variant => (
                <option key={variant._id} value={variant._id}>{variant.weight}</option>
              ))}
            </select>
          )}

          {/* Price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
            {activeProduct.isNegotiable && !activeProduct.price ? (
              <div>
                <span style={{
                  fontSize: '1.3rem', fontWeight: '800',
                  background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Negotiable Price 🤝</span>
                <p style={{ fontSize: '0.83rem', color: '#78716C', marginTop: '4px' }}>
                  Contact us to discuss the best price for you
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: '800', color: hasDiscount ? '#16A34A' : '#1C1917' }}>
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span style={{ fontSize: '1rem', color: '#A8A29E', textDecoration: 'line-through' }}>
                    {formatPrice(activeProduct.price)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {activeProduct.weight && (
              <span style={{ background: '#F5F5F4', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: '600', color: '#57534E' }}>
                Weight: {activeProduct.weight}
              </span>
            )}
            {product.category && (
              <span style={{ background: '#FEF3C7', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: '600', color: '#92400E' }}>
                {getCategoryEmoji(product.category)} {product.category}
              </span>
            )}
            {activeProduct.inStock === false ? (
              <span style={{ background: '#FEE2E2', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: '600', color: '#991B1B' }}>
                ❌ Out of Stock
              </span>
            ) : (
              <span style={{ background: '#DCFCE7', borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: '600', color: '#14532D' }}>
                ✅ In Stock
              </span>
            )}
          </div>

          {product.description && (
            <p style={{ fontSize: '0.9rem', color: '#57534E', lineHeight: '1.6', marginBottom: '16px' }}>
              {product.description}
            </p>
          )}
        </div>

        {/* Bottom CTA */}
        <div style={{ padding: '0 20px 20px' }}>
          {activeProduct.inStock === false ? (
            <button className="btn-secondary" style={{ opacity: 0.5 }} disabled>
              ❌ Out of Stock
            </button>
          ) : qty === 0 ? (
            <button className="btn-primary" onClick={handleAdd}>
              🛒 Add to Cart
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="qty-control" style={{ flex: 1 }}>
                <button className="qty-btn" onClick={() => updateQty(activeKey, qty - 1)}>−</button>
                <input
                  className="qty-input"
                  type="number"
                  min="0"
                  max="9999"
                  value={qty}
                  onChange={handleQtyInput}
                  aria-label={`Quantity for ${product.name}`}
                />
                <button className="qty-btn" onClick={() => updateQty(activeKey, qty + 1)}>+</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
