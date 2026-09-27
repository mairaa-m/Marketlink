export const formatCurrency = (value) => new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  maximumFractionDigits: 0,
}).format(value)

export const cx = (...classes) => classes.filter(Boolean).join(' ')

export const getInitials = (name = '') => name
  .split(' ')
  .map((part) => part[0])
  .slice(0, 2)
  .join('')
  .toUpperCase()

export const orderSteps = ['placed', 'accepted', 'preparing', 'ready', 'completed']

export const statusLabel = (status) => ({
  placed: 'Placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
  declined: 'Declined',
}[status] || status)

export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

// --- Availability & freshness helpers (smart availability system) ---

export function getAvailability(product) {
  if (!product) return { key: 'sold-out', label: 'Sold Out', tone: 'out' }
  if (!product.available || product.stock <= 0) return { key: 'sold-out', label: 'Sold Out', tone: 'out' }
  if (product.recentlyRestocked) return { key: 'restocked', label: 'Recently Restocked', tone: 'good' }
  if (product.stock <= 2) return { key: 'almost-gone', label: 'Almost Sold Out', tone: 'warn' }
  if (product.stock <= 8) return { key: 'limited', label: 'Limited Stock', tone: 'warn' }
  return { key: 'in-stock', label: 'In Stock', tone: 'good' }
}

export function getFreshness(product) {
  if (!['Vegetables', 'Fruit', 'Fruits'].includes(product?.category)) return { days: null, harvestLabel: '', freshLabel: '' }
  const days = product?.harvestDaysAgo ?? 0
  const harvestLabel = days === 0 ? 'Harvested today' : days === 1 ? 'Harvested yesterday' : `Harvested ${days} days ago`
  const freshLabel = days === 0 ? 'Fresh Today' : days === 1 ? 'Fresh' : 'Good'
  return { days, harvestLabel, freshLabel }
}

export function formatLastUpdated(minutesAgo = 0) {
  if (minutesAgo < 1) return 'Updated just now'
  if (minutesAgo < 60) return `Updated ${minutesAgo}m ago`
  const hours = Math.round(minutesAgo / 60)
  if (hours < 24) return `Updated ${hours}h ago`
  return `Updated ${Math.round(hours / 24)}d ago`
}

export const formatDistance = (km) => km == null ? '' : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
