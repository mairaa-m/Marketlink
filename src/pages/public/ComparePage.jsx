import { ArrowLeft, Bell, CalendarClock, Clock3, MapPin, PackageCheck, ShoppingBasket, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import StarRating from '../../components/shared/StarRating'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { formatCurrency, formatDistance, formatLastUpdated, getAvailability, getFreshness } from '../../utils/helpers'

const sortOptions = [
  { key: 'price', label: 'Lowest price' },
  { key: 'freshness', label: 'Freshest first' },
  { key: 'distance', label: 'Nearest' },
  { key: 'rating', label: 'Highest rated' },
  { key: 'stock', label: 'Most in stock' },
]

export default function ComparePage() {
  const { productId } = useParams()
  const db = api.snapshot()
  const anchor = db.products.find((item) => item.id === productId)
  const { addItem } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const notify = async (product) => {
    if (!user) { navigate('/login', { state: { from: `/compare/${productId}` } }); return }
    try { await api.subscriptions.notifyMe(user.id, product.id); toast.success('Saved. A notification will appear when this item is restocked.') } catch (error) { toast.error(error.message) }
  }
  const [sort, setSort] = useState('price')
  const group = anchor?.comparisonGroup
  const listings = useMemo(() => {
    if (!anchor) return []
    const items = group ? db.products.filter((item) => item.comparisonGroup === group && item.unit === anchor.unit) : [anchor]
    return [...items].sort((a, b) => {
      if (sort === 'price') return a.price - b.price
      if (sort === 'freshness') return (getFreshness(a).days ?? Infinity) - (getFreshness(b).days ?? Infinity)
      if (sort === 'distance') return (a.distanceKm ?? 99) - (b.distanceKm ?? 99)
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'stock') return b.stock - a.stock
      return 0
    })
  }, [db.products, group, sort, anchor])

  if (!anchor) return <Navigate to="/products" replace />

  const cheapest = Math.min(...listings.map((item) => item.price))
  const freshest = Math.min(...listings.map((item) => getFreshness(item).days ?? Infinity))
  const nearest = Math.min(...listings.map((item) => item.distanceKm ?? Infinity))
  const mostStock = Math.max(...listings.map((item) => item.stock))

  const addToCart = (product) => {
    const availability = getAvailability(product)
    if (availability.key === 'sold-out') return
    addItem(product)
    toast.success(`${product.name} from ${db.farmers.find((f) => f.id === product.farmerId)?.name} added to basket`)
  }

  return (
    <main className="compare-page">
      <section className="page-hero page-hero--compact">
        <div className="shell">
          <Link to={`/products/${anchor.id}`} className="back-light"><ArrowLeft /> Back to product</Link>
          <p className="eyebrow eyebrow--gold">PRICE COMPARISON</p>
          <h1>Compare <em>{group || anchor.name}</em> from every grower.</h1>
          <p>{listings.length} {listings.length === 1 ? 'farmer sells' : 'farmers sell'} this item. Weigh price against freshness, distance and stock before you reserve.</p>
        </div>
      </section>

      <section className="section section--paper section--compact">
        <div className="shell">
          <div className="compare-toolbar">
            <span>{listings.length} listings found. Compare this item across local farmers.</span>
            <label>Sort by
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                {sortOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
              </select>
            </label>
          </div>

          {listings.length < 2 && <p className="compare-hint">Only one farmer currently lists this exact item. Check back soon as more growers add stock.</p>}

          <div className="compare-grid">
            {listings.map((product) => {
              const farmer = db.farmers.find((item) => item.id === product.farmerId)
              const market = db.markets.find((item) => product.marketIds.includes(item.id))
              const availability = getAvailability(product)
              const freshness = getFreshness(product)
              const soldOut = availability.key === 'sold-out'
              return (
                <article className="compare-card" key={product.id}>
                  <div className="compare-card-media">
                    <img src={product.image} alt={product.name} />
                    {product.price === cheapest && <span className="compare-badge compare-badge--price">Lowest price</span>}
                    {freshness.harvestLabel && freshness.days === freshest && <span className="compare-badge compare-badge--fresh">Freshest</span>}
                    {product.distanceKm === nearest && <span className="compare-badge compare-badge--near">Nearest</span>}
                  </div>
                  <div className="compare-card-body">
                    <p className="eyebrow">{farmer?.name}</p><div className="compare-links"><Link to={`/farmers/${product.farmerId}`}>View Farmer</Link><Link to={`/products/${product.id}`}>View Product</Link></div>
                    <h3>{product.name}</h3>
                    <div className="compare-price"><strong>{formatCurrency(product.price)}</strong><span>/ {product.unit}</span></div>
                    <ul className="compare-facts">
                      <li><PackageCheck /> Stock: <b>{product.stock === mostStock && !soldOut ? `${product.stock} ${product.unit} (most)` : `${product.stock} ${product.unit}`}</b></li>
                      <li><MapPin /> Distance: <b>{formatDistance(product.distanceKm) || 'Not provided'}</b></li>
                      <li><Star /> Rating: <b>{product.rating.toFixed(1)}</b> ({product.reviews})</li>
                      {freshness.harvestLabel && <li><Clock3 /> {freshness.harvestLabel}</li>}
                      <li><CalendarClock /> Pickup: <b>{market?.hours || product.pickupWindow || 'See market details'}</b></li>
                    </ul>
                    <div className={`availability-row availability-row--${availability.tone}`}><i />{availability.label}</div>
                    <p className="compare-updated">{formatLastUpdated(product.lastUpdatedMinutesAgo)} · {market?.name}</p>
                    <div className="compare-markets">{db.markets.filter((item) => product.marketIds.includes(item.id)).map((item) => <Link key={item.id} to={`/markets/${item.id}`}>{item.name} - {item.day}, {item.hours}</Link>)}</div><StarRating value={product.rating} label={false} />
                    <button className="btn btn--large" disabled={soldOut} onClick={() => addToCart(product)}><ShoppingBasket /> {soldOut ? 'Sold Out' : 'Add to basket'}</button>{soldOut && <button className="btn btn--outline" onClick={() => notify(product)}><Bell /> Notify Me</button>}
                  </div>
                </article>
              )
            })}
          </div>

          <p className="compare-disclaimer">MarketLink shows every farmer's price, stock and freshness side by side — we never pick a "best" one for you. Compare and choose what matters most.</p>
        </div>
      </section>
    </main>
  )
}
