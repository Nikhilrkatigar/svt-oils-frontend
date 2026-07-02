import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('svt_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('svt_cart', JSON.stringify(items))
  }, [items])

  const addItem = (product) => {
    setItems(prev => {
      const key = product.cartKey || product._id
      const existing = prev.find(i => (i.cartKey || i._id) === key)
      if (existing) {
        return prev.map(i => (i.cartKey || i._id) === key ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...product, cartKey: key, qty: 1 }]
    })
  }

  const removeItem = (productId) => {
    setItems(prev => prev.filter(i => (i.cartKey || i._id) !== productId))
  }

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      removeItem(productId)
      return
    }
    setItems(prev => prev.map(i => (i.cartKey || i._id) === productId ? { ...i, qty } : i))
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, i) => sum + i.qty, 0)

  const totalPrice = items.reduce((sum, i) => {
    const price = (i.isNegotiable && i.price == null) ? 0 : (i.discountPrice ?? i.price)
    return sum + price * i.qty
  }, 0)

  const hasNegotiable = items.some(i => i.isNegotiable && i.price == null)

  const getQty = (productId) => {
    const item = items.find(i => (i.cartKey || i._id) === productId)
    return item ? item.qty : 0
  }

  const setCartItems = (newItems) => setItems(newItems)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQty, clearCart,
      totalItems, totalPrice, hasNegotiable, getQty, setCartItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
