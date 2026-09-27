import { ArrowLeft, ArrowRight, Minus, Plus, ShieldCheck, ShoppingBasket, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/helpers'

const COMPLEMENTS = {
  Vegetables: ['p-26', 'p-17'],
  Fruit: ['p-23', 'p-25'],
  Bakery: ['p-32', 'p-34'],
  Eggs: ['p-37', 'p-35'],
  'Other Produce': ['p-1', 'p-37'],
  Dairy: ['p-3'],
}

export default function CartPage() {
  const { items: storedItems, updateQuantity, removeItem, addItem } = useCart()
  const db = api.snapshot()
  const items = storedItems.map((item) => ({ ...item, ...(db.products.find((product) => product.id === item.id) || { stock: 0, available: false }), quantity: item.quantity }))
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const invalidItems = items.some((item) => !item.available || item.stock < item.quantity)
  const sharedMarkets = db.markets.filter((market) => items.every((item) => item.marketIds.includes(market.id)))

  const suggestions = (() => {
    const inCart = new Set(items.map((item) => item.id))
    const categories = new Set(items.map((item) => item.category))
    const ids = new Set()
    categories.forEach((category) => (COMPLEMENTS[category] || []).forEach((id) => ids.add(id)))
    return [...ids]
      .map((id) => db.products.find((product) => product.id === id))
      .filter((product) => product && product.available && product.stock > 0 && !inCart.has(product.id) && sharedMarkets.some((market) => product.marketIds.includes(market.id)))
      .slice(0, 4)
  })()

  const quickAdd = (product) => { addItem(product, 1); toast.success(`${product.name} added to your basket`) }

  return <main><section className="page-hero page-hero--compact"><div className="shell"><p className="eyebrow eyebrow--gold">YOUR RESERVATION</p><h1>Market <em>basket.</em></h1></div></section><section className="section section--paper"><div className="shell cart-layout">{items.length ? <><div className="cart-items"><div className="cart-heading"><h2>{items.length} fresh {items.length === 1 ? 'item' : 'items'}</h2><Link to="/products"><ArrowLeft /> Keep shopping</Link></div>{items.map((item) => <article className="cart-item" key={item.id}><img src={item.image} alt={item.name} /><div><small>{item.category}</small><h3>{item.name}</h3><p>{formatCurrency(item.price)} / {item.unit}</p><span className="stock"><i />{!item.available ? 'Sold Out - remove to continue' : `${item.stock} available`}{item.quantity > item.stock && item.available ? ' - reduce quantity' : ''}</span></div><div className="quantity"><button aria-label={`Decrease ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus /></button><b>{item.quantity}</b><button aria-label={`Increase ${item.name}`} disabled={!item.available || item.quantity >= item.stock} onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus /></button></div><strong>{formatCurrency(item.price * item.quantity)}</strong><button className="remove-btn" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}><Trash2 /></button></article>)}

    {suggestions.length > 0 && <div className="smart-basket"><p className="eyebrow">YOU MAY ALSO NEED</p><div className="smart-basket-row">{suggestions.map((product) => <article key={product.id} className="smart-basket-item"><img src={product.image} alt={product.name} /><div><b>{product.name}</b><span>{formatCurrency(product.price)}/{product.unit}</span></div><button className="icon-btn" onClick={() => quickAdd(product)} aria-label={`Add ${product.name}`}><Plus /></button></article>)}</div></div>}
    </div><aside className="cart-summary"><p className="eyebrow">ORDER SUMMARY</p><div><span>Basket total</span><b>{formatCurrency(total)}</b></div><div><span>Reservation fee</span><b>Free</b></div><div className="summary-total"><span>Pay at pickup</span><strong>{formatCurrency(total)}</strong></div><Link className="btn btn--large" to="/checkout">Choose pickup date and time <ArrowRight /></Link>{invalidItems && <p role="alert">Some items are no longer available in this quantity. Update your basket before reserving.</p>}<p><ShieldCheck /> You will not be charged online. Pay the farmer directly when you collect.</p></aside></> : <div className="empty-state empty-state--cart"><ShoppingBasket /><h2>Your basket is waiting.</h2><p>Reserve fresh items before market day and collect them in one easy trip.</p><Link className="btn" to="/products">Browse this week's harvest <ArrowRight /></Link></div>}</div></section></main>
}
