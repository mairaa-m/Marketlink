export const categoryName = (category) => category === 'Fruit' ? 'Fruits' : category
export const typeKey = (product) => `${product.comparisonGroup || product.id}:${product.unit}`
export function catalogTypes(db) {
  return [...new Map(db.products.filter((product) => product.available && product.stock > 0 && db.farmers.some((farmer) => farmer.id === product.farmerId && farmer.status === 'approved')).map((product) => [typeKey(product), {
    key: typeKey(product), name: product.comparisonGroup ? product.comparisonGroup[0].toUpperCase() + product.comparisonGroup.slice(1) : product.name,
    category: categoryName(product.category), unit: product.unit,
  }])).values()]
}
export function quantityLabel(item) {
  if (item.unit === 'dozen' && item.category === 'Eggs') return `${item.quantity * 12} eggs (${item.quantity} dozen)`
  const plural = { bunch: 'bunches', loaf: 'loaves', box: 'boxes', jar: 'jars', pack: 'packs', litre: 'litres' }
  return `${item.quantity} ${item.quantity > 1 ? plural[item.unit] || item.unit : item.unit}`
}
export function planForMarket(db, market, list) {
  const picks = list.map((item) => ({ ...item, product: db.products.filter((product) => typeKey(product) === item.key && product.marketIds.includes(market.id) && product.available && product.stock >= item.quantity && db.farmers.some((farmer) => farmer.id === product.farmerId && farmer.status === 'approved' && farmer.marketIds.includes(market.id))).sort((a, b) => a.price - b.price)[0] || null }))
  const found = picks.filter((pick) => pick.product)
  const stops = [...new Set(found.map((pick) => pick.product.farmerId))].map((id) => ({ farmer: db.farmers.find((farmer) => farmer.id === id), picks: found.filter((pick) => pick.product.farmerId === id) }))
  return { market, picks, stops, foundCount: found.length, total: found.reduce((sum, pick) => sum + pick.product.price * pick.quantity, 0) }
}
