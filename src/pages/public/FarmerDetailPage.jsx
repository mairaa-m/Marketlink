import { ArrowLeft, ArrowRight, CalendarDays, Heart, Leaf, MapPin, PackageCheck, Star, Store } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import ProductCard from '../../components/shared/ProductCard'
import StarRating from '../../components/shared/StarRating'
import { useAuth } from '../../context/AuthContext'

export default function FarmerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, toggleFavorite } = useAuth()
  const db = api.snapshot()
  const farmer = db.farmers.find((item) => item.id === id)
  if (!farmer) return <Navigate to="/farmers" replace />

  const products = db.products.filter((item) => item.farmerId === id)
  const available = products.filter((item) => item.available && item.stock > 0)
  const markets = db.markets.filter((item) => farmer.marketIds.includes(item.id))
  const reviews = db.reviews.filter((review) => products.some((product) => product.id === review.productId))
  const heroProduct = products.find((item) => item.available) || products[0]
  const primaryMarket = markets[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const openToday = farmer.status === 'approved' && available.length > 0 && markets.some((market) => market.day.includes(today))
  const saved = user?.favorites?.includes(id)

  const favorite = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/farmers/${id}` } })
      return
    }
    try { await toggleFavorite(id) } catch (error) { toast.error(error.message) }
  }

  return (
    <main>
      <section className="farmer-profile-hero farmer-profile-hero--refined">
        <div className="shell">
          <Link className="back-light" to="/farmers"><ArrowLeft /> All farmers</Link>
          <div className="farmer-profile-layout">
            <div className="farmer-profile-copy">
              <div className="farmer-avatar-large" aria-label={`${farmer.name} avatar`}>{farmer.initials}<Leaf /></div>
              <p className="eyebrow eyebrow--gold">LOCAL FARMER PROFILE</p>
              <h1>{farmer.name}</h1>
              <p>{farmer.bio}</p>
              <div className="profile-rating"><StarRating value={farmer.rating} /><span>{farmer.rating.toFixed(1)} rating · {farmer.reviews} reviews</span></div>
              <div className="farmer-profile-actions">
                <button className="btn btn--harvest" onClick={favorite}><Heart />{saved ? 'Unsave farmer' : 'Favorite Farmer'}</button>
                <Link className="btn btn--ghost-light" to="/products">Browse stock <ArrowRight /></Link>
              </div>
            </div>

            <aside className="farmer-profile-card">
              {heroProduct && <img src={heroProduct.image} alt={`${farmer.name} produce`} />}
              <div className="farmer-profile-card__body">
                <span className={openToday ? 'status-pill status-pill--ready' : 'status-pill status-pill--pending'}>{openToday ? 'Open today' : 'See market days'}</span>
                <div className="farmer-sign"><span>{farmer.initials}</span><div><strong>{farmer.owner}</strong><small>{farmer.name} · {primaryMarket?.address || farmer.liveLocation || 'Lahore'}</small></div></div>
                <div className="farmer-profile-stats">
                  <span><b>{available.length}</b><small>In stock</small></span>
                  <span><b>{farmer.years}</b><small>Years</small></span>
                  <span><b>{markets.length}</b><small>Markets</small></span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section--sage section--compact">
        <div className="shell farmer-profile-overview">
          <article><Star /><small>Rating</small><b>{farmer.rating.toFixed(1)} / 5</b><p>{farmer.reviews} customer reviews</p></article>
          <article><PackageCheck /><small>Current stock</small><b>{available.length} items</b><p>Updated by the grower</p></article>
          <article><Store /><small>Specialties</small><b>{farmer.specialties.slice(0, 2).join(' · ') || 'Fresh produce'}</b><p>{farmer.years} years growing for Lahore</p></article>
        </div>
      </section>

      <section className="section section--paper section--compact">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow">AVAILABLE PRODUCTS</p><h2>This week at <em>{farmer.name.split(' ')[0]}.</em></h2></div><p>{available.length} available · stock shown on each listing.</p></div>
          <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} farmer={farmer} />)}</div>
          {!products.length && <div className="empty-state"><PackageCheck /><h2>No products listed yet.</h2><p>This farmer has not published stock for the week.</p></div>}
        </div>
      </section>

      <section className="section section--sage section--compact">
        <div className="shell pickup-grid pickup-grid--refined">
          <div><p className="eyebrow">MARKETS & PICKUP</p><h2>Plan your visit.</h2><p>Collect at the farmer’s stall during market hours.</p></div>
          <div>{markets.map((market) => <article key={market.id} className="pickup-card"><Link to={`/markets/${market.id}`} className="pickup-row"><span><CalendarDays /></span><div><small>{market.day}</small><h3>{market.name}</h3><p>{market.address}</p><p>{market.hours}</p></div><b>View</b></Link><a className="arrow-link" href={`https://www.openstreetmap.org/directions?to=${market.lat},${market.lng}`} target="_blank" rel="noreferrer">Directions <MapPin /></a></article>)}{!markets.length && <div className="empty-state"><MapPin /><h2>No pickup markets assigned yet.</h2></div>}</div>
        </div>
      </section>

      <section className="section section--paper section--compact">
        <div className="shell">
          <div className="section-heading"><div><p className="eyebrow">REVIEWS</p><h2>Customer notes.</h2></div><p>Verified feedback from completed pickups.</p></div>
          <div className="review-grid review-grid--refined">{reviews.map((review) => <article key={review.id}><StarRating value={review.rating} /><b>{review.customer}</b><small>{products.find((item) => item.id === review.productId)?.name} · {review.date}</small><p>{review.comment}</p>{review.response && <footer><b>Farmer response:</b> {review.response}</footer>}</article>)}</div>
          {!reviews.length && <div className="empty-state"><Star /><h2>No written reviews yet.</h2><p>Reviews appear after customers complete pickup.</p></div>}
        </div>
      </section>
    </main>
  )
}
