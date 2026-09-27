import { Bell, Heart, Scale, ShoppingBasket } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useCompare } from '../../context/CompareContext'
import api from '../../api'
import { formatCurrency, getAvailability, getFreshness } from '../../utils/helpers'
import StarRating from './StarRating'

export default function ProductCard({ product, farmer }) {
  const { addItem } = useCart()
  const { user, toggleFavorite } = useAuth()
  const compare = useCompare()
  const navigate = useNavigate()
  const favorite = Boolean(user?.favorites?.includes(product.id))
  const onFavorite = async (id) => {
    if (!user) {
      navigate('/login', { state: { from: window.location.pathname } })
      return
    }
    try {
      const saved = await toggleFavorite(id)
      toast.success(saved ? 'Saved to your favorites' : 'Removed from your favorites')
    } catch (error) {
      toast.error(error.message)
    }
  }
  const availability = getAvailability(product)
  const freshness = getFreshness(product)
  const soldOut = availability.key === 'sold-out'
  const add = () => {
    addItem(product)
    toast.success(`${product.name} added to your basket`)
  }
  const notifyMe = async () => {
    if (!user) { navigate('/login', { state: { from: window.location.pathname } }); return }
    try { await api.subscriptions.notifyMe(user.id, product.id); toast.success(`Restock notification saved for ${product.name}`) } catch (error) { toast.error(error.message) }
  }
  const onCompare = (event) => {
    event.preventDefault()
    if (!product.comparisonGroup) { navigate(`/products/${product.id}`); return }
    compare?.addItem(product)
    navigate(`/compare/${product.id}`)
  }
  return (
    <article className="product-card">
      <Link to={`/products/${product.id}`} className="product-media">
        <img src={product.image} alt={product.name} loading="lazy" />
        {soldOut && <span className="sold-mask">Sold Out</span>}
      </Link>
      <button className={`favorite-btn ${favorite ? 'is-active' : ''}`} type="button" onClick={() => onFavorite?.(product.id)} aria-label={`Save ${product.name}`}><Heart /></button>
      <div className="product-body">
        <div className="product-meta"><span>{farmer?.name}</span><StarRating value={product.rating} size={13} label={false} /></div>
        <div className="product-title-row"><Link to={`/products/${product.id}`}><h3>{product.name}</h3></Link><p className="price">{formatCurrency(product.price)}<small>/{product.unit}</small></p></div>
        <div className={`availability-row availability-row--${availability.tone}`}><i />{availability.label}<span className="freshness-dot">· {product.freshWindow ? 'Morning stock' : freshness.freshLabel}</span></div>
        <div className="product-actions">
          <span className={soldOut ? 'stock stock--out' : 'stock'}><i />{soldOut ? 'Sold Out' : `${product.stock} left`}</span>
          {soldOut
            ? <><button className="btn btn--small" disabled>Add to Basket</button><button className="btn btn--small btn--outline" type="button" onClick={notifyMe}><Bell /> Notify Me</button></>
            : <button className="btn btn--small" type="button" onClick={add}>Add <ShoppingBasket /></button>}
        </div>
        {product.comparisonGroup && <button className="compare-link" type="button" onClick={onCompare}><Scale /> Compare prices</button>}
      </div>
    </article>
  )
}
