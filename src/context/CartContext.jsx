/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api'
import useLocalStorage from '../hooks/useLocalStorage'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [storedItems, setItems] = useLocalStorage('marketlink_cart', [])

  const [, refresh] = useState(0)
  useEffect(() => { const update = () => refresh((value) => value + 1); window.addEventListener('marketlink:data', update); window.addEventListener('storage', update); return () => { window.removeEventListener('marketlink:data', update); window.removeEventListener('storage', update) } }, [])
  const db = api.snapshot()
  const items = storedItems.map((item) => ({ ...item, ...(db.products.find((product) => product.id === item.id) || { stock: 0, available: false }), quantity: item.quantity }))
  const [tripCheckout, setTripCheckout] = useLocalStorage('marketlink_trip_checkout', null)
  const setTripItems = (nextItems, marketId) => {
    setTripCheckout({ marketId, previousItems: tripCheckout?.previousItems || items })
    setItems(nextItems)
  }
  const cancelTrip = () => { setItems(tripCheckout?.previousItems || items); setTripCheckout(null) }
  const addItem = (product, quantity = 1) => setItems((current) => {
    if (!product.available || product.stock <= 0 || quantity < 1) return current
    const found = current.find((item) => item.id === product.id)
    if (found) return current.map((item) => item.id === product.id ? { ...item, ...product, quantity: Math.min(product.stock, item.quantity + quantity) } : item)
    return [...current, { ...product, quantity: Math.min(quantity, product.stock) }]
  })
  const updateQuantity = (id, quantity) => setItems((current) => quantity <= 0 ? current.filter((item) => item.id !== id) : current.map((item) => item.id === id ? { ...item, quantity: Math.min(db.products.find((product) => product.id === id)?.stock || 0, quantity) } : item))
  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id))
  const clearCart = () => { setItems(tripCheckout?.previousItems || []); setTripCheckout(null) }
  const count = items.reduce((sum, item) => sum + item.quantity, 0)
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const value = { items, count, total, addItem, updateQuantity, removeItem, clearCart, setTripItems, tripCheckout, cancelTrip }
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
