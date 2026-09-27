/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

const CompareContext = createContext(null)
const MAX_COMPARE = 4

export function CompareProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = (product) => setItems((current) => {
    if (current.some((item) => item.id === product.id)) return current
    if (current.length && current[0].comparisonGroup !== product.comparisonGroup) {
      // Switching to a different kind of product starts a fresh comparison.
      return [product]
    }
    return [...current, product].slice(0, MAX_COMPARE)
  })
  const removeItem = (id) => setItems((current) => current.filter((item) => item.id !== id))
  const clear = () => setItems([])
  const isComparing = (id) => items.some((item) => item.id === id)

  const value = { items, addItem, removeItem, clear, isComparing, max: MAX_COMPARE }
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export const useCompare = () => useContext(CompareContext)
