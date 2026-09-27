import { ArrowLeft, Bell, Check, Heart, Minus, Plus, Scale, ShoppingBasket, Sprout } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import StarRating from '../../components/shared/StarRating'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useCompare } from '../../context/CompareContext'
import { formatCurrency, formatDistance, formatLastUpdated, getAvailability, getFreshness } from '../../utils/helpers'

export default function ProductDetailPage() {
  const { id } = useParams()
  const db = api.snapshot()
  const product = db.products.find((item) => item.id === id)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const { user, toggleFavorite } = useAuth()
  const saved = user?.favorites?.includes(id)
  const saveFavorite = async () => {
    if (!user) { navigate('/login', { state: { from: `/products/${id}` } }); return }
    try { await toggleFavorite(id) } catch (error) { toast.error(error.message) }
  }
  const compare = useCompare()
  const navigate = useNavigate()
  if (!product) return <Navigate to="/products" replace />
  const farmer = db.farmers.find((item) => item.id === product.farmerId)
  const market = db.markets.find((item) => product.marketIds.includes(item.id))
  const reviews = db.reviews.filter((item) => item.productId === product.id)
  const availability = getAvailability(product)
  const freshness = getFreshness(product)
  const soldOut = availability.key === 'sold-out'
  const peers = db.products.filter((item) => item.comparisonGroup && item.comparisonGroup === product.comparisonGroup)
  const add = () => { addItem(product, quantity); toast.success(`${quantity} × ${product.name} added to basket`) }
  const notifyMe = async () => {
    if (!user) { navigate('/login', { state: { from: window.location.pathname } }); return }
    try { await api.subscriptions.notifyMe(user.id, product.id); toast.success(`Restock notification saved for ${product.name}`) } catch (error) { toast.error(error.message) }
  }
  const goCompare = () => { compare?.addItem(product); navigate(`/compare/${product.id}`) }
  return <main className="detail-page"><div className="shell detail-back"><Link to="/products"><ArrowLeft /> Back to the harvest</Link></div><section className="product-detail shell"><div className="detail-media"><img src={product.image} alt={product.name} /><span className="tag tag--light">{product.badge}</span></div><div className="detail-copy"><p className="eyebrow">{product.category} · {farmer?.name}</p><h1>{product.name}</h1><div className="detail-rating"><StarRating value={product.rating} /><span>{product.reviews} verified reviews</span></div><p className="detail-description">{product.description}</p><div className="detail-price"><strong>{formatCurrency(product.price)}</strong><span>per {product.unit}</span></div><div className="freshness-panel">{freshness.harvestLabel && <span className="freshness-chip">{freshness.harvestLabel}</span>}{freshness.freshLabel && <span className="freshness-chip">{freshness.freshLabel}</span>}<span className="freshness-chip freshness-chip--muted">{formatLastUpdated(product.lastUpdatedMinutesAgo)}</span>{product.distanceKm != null && <span className="freshness-chip freshness-chip--muted">{formatDistance(product.distanceKm)} away</span>}</div><div className="stock-panel"><span className={`availability-row availability-row--${availability.tone}`}><i />{availability.label}{!soldOut && ` · ${product.stock} ${product.unit}s available`}</span><small>Stock is reserved immediately when you place an order.</small></div><div className="quantity-row">{soldOut ? <><button className="btn btn--large" disabled>Add to Basket - Sold Out</button><button className="btn btn--large btn--outline" onClick={notifyMe}><Bell /> Notify me when available</button></> : <><div className="quantity"><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus /></button><b>{quantity}</b><button aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}><Plus /></button></div><button className="btn btn--large" disabled={soldOut} onClick={add}><ShoppingBasket /> Add to basket · {formatCurrency(product.price * quantity)}</button></>}<button className={`icon-btn ${saved ? 'is-active' : ''}`} aria-label={saved ? 'Unsave product' : 'Save product'} onClick={saveFavorite}><Heart /></button>{peers.length > 1 && <button className="btn btn--outline btn--large" onClick={goCompare}><Scale /> Compare prices</button>}</div>{peers.length > 1 && <p className="compare-hint">{peers.length} farmers sell this — see who has the best price, freshness and distance.</p>}<div className="pickup-card"><Sprout /><div><small>COLLECT FROM</small><strong>{market?.name}</strong><span>{market?.day} · {product.pickupWindow || market?.hours}</span></div><Check /></div></div></section><section className="section section--sage"><div className="shell info-grid"><div><p className="eyebrow">FROM THE GROWER</p><h2>Grown with a name attached.</h2></div><div><p>{farmer?.bio}</p><Link className="arrow-link" to={`/farmers/${farmer?.id}`}>Meet {farmer?.owner} <ArrowLeft className="flip" /></Link></div></div></section><section className="section section--paper"><div className="shell reviews-section"><div className="section-heading"><div><p className="eyebrow">CUSTOMER NOTES</p><h2>What people <em>tasted.</em></h2></div><div className="rating-big"><b>{product.rating}</b><StarRating value={product.rating} label={false} /><span>{product.reviews} reviews</span></div></div><div className="review-grid">{reviews.length ? reviews.map((review) => <article key={review.id}><StarRating value={review.rating} label={false} /><p>“{review.comment}”</p><footer><b>{review.customer}</b><span>{review.date}</span></footer>{review.response && <p><b>Farmer response:</b> {review.response}</p>}</article>) : <article><p>Be the first to review this item after pickup.</p></article>}</div></div></section></main>
}
