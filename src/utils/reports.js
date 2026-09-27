export function reportRows(report, db) {
  if (report === 'Market activity report') return [['Market', 'Operating days', 'Orders'], ...db.markets.map((market) => [market.name, market.day, db.orders.filter((order) => order.marketId === market.id).length])]
  if (report === 'Farmer revenue summary') return [['Farmer', 'Completed revenue PKR'], ...db.farmers.map((farmer) => [farmer.name, db.orders.filter((order) => order.farmerId === farmer.id && order.status === 'completed').reduce((sum, order) => sum + order.total, 0)])]
  if (report === 'Customer growth report') return [['Name', 'Email', 'Orders'], ...db.users.filter((user) => user.role === 'customer').map((user) => [user.name, user.email, db.orders.filter((order) => order.customerId === user.id).length])]
  return [['Product', 'Stock', 'Unit', 'Available'], ...db.products.map((product) => [product.name, product.stock, product.unit, product.available])]
}
export function downloadReport(report, db) {
  const csv = reportRows(report, db).map((row) => row.map((value) => '"' + String(value).replace(/^[=+@-]/, "'$&").replaceAll('"', '""') + '"').join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a'); link.href = url; link.download = report.toLowerCase().replaceAll(' ', '-') + '.csv'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
