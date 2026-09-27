import { ArrowLeft, CalendarDays, Check, Clock3, MapPin, Navigation, Star } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import StarRating from '../../components/shared/StarRating'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, orderSteps, statusLabel } from '../../utils/helpers'

export default function CustomerOrderDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const [version, setVersion] = useState(0)
  const [rating, setRating] = useState(0)
  const [productId, setProductId] = useState('')
  const [comment, setComment] = useState('')
  const db = api.snapshot()
  const order = db.orders.find((item) => item.id === id)
  if (!order || order.customerId !== user.id) return <Navigate to='/customer/dashboard' replace />
  const market = db.markets.find((item) => item.id === order.marketId)
  const stepIndex = orderSteps.indexOf(order.status)
  const cancel = async () => {
    try {
      await api.orders.updateStatus(order.id, 'cancelled')
      setVersion(version + 1)
      toast.success('Reservation cancelled and stock returned')
    } catch (error) {
      toast.error(error.message)
    }
  }
  const complete = async () => {
    try { await api.orders.updateStatus(order.id, 'completed'); setVersion((value) => value + 1); toast.success('Pickup completed. You can now leave a review.') } catch (error) { toast.error(error.message) }
  }
  const review = async (event) => {
    event.preventDefault()
    try {
      await api.reviews.create({ orderId: order.id, customerId: user.id, productId: productId || order.items.find((line) => !db.reviews.some((entry) => entry.orderId === order.id && entry.productId === line.productId))?.productId, customer: user.name, rating, comment })
      setVersion(version + 1)
      toast.success('Thank you for your review')
      setComment(''); setRating(0); setProductId('')
    } catch (error) {
      toast.error(error.message)
    }
  }
  return <main><section className="page-hero page-hero--compact"><div className="shell"><Link className="back-light" to="/customer/dashboard"><ArrowLeft /> Dashboard</Link><p className="eyebrow eyebrow--gold">ORDER {order.id}</p><h1>{location.state?.justPlaced && order.status === 'placed' ? 'Reservation confirmed.' : statusLabel(order.status)}</h1><p>{location.state?.justPlaced ? 'Your stock is secured. We’ve prepared the pickup details below.' : `Placed on ${order.createdAt}`}</p></div></section><section className="section section--paper"><div className="shell order-detail-layout"><div><section className="order-progress"><div className="dashboard-title"><div><p className="eyebrow">ORDER PROGRESS</p><h2>{order.status === 'cancelled' ? 'This order was cancelled.' : 'From reserved to collected.'}</h2></div><span className={`status-pill status-pill--${order.status}`}>{statusLabel(order.status)}</span></div><div className="progress-steps">{orderSteps.map((step, index) => <div className={index <= stepIndex ? 'is-complete' : ''} key={step}><span>{index < stepIndex ? <Check /> : index + 1}</span><b>{statusLabel(step)}</b></div>)}</div></section><section className="order-lines"><p className="eyebrow">YOUR ITEMS</p>{order.items.map((item) => <div key={item.productId}><span>{item.quantity}×</span><strong>{item.name}</strong><b>{formatCurrency(item.price * item.quantity)}</b></div>)}<footer><span>Total due at pickup</span><strong>{formatCurrency(order.total)}</strong></footer></section>{order.status === 'completed' && order.items.some((line) => !db.reviews.some((item) => item.orderId === order.id && item.productId === line.productId && item.customerId === user.id)) && <section className="review-form"><Star /><p className="eyebrow">HOW WAS YOUR HARVEST?</p><h2>Leave a verified review.</h2><form onSubmit={review}><label>Product<select value={productId || order.items.find((line) => !db.reviews.some((entry) => entry.orderId === order.id && entry.productId === line.productId))?.productId} onChange={(event) => setProductId(event.target.value)}>{order.items.filter((line) => !db.reviews.some((entry) => entry.orderId === order.id && entry.productId === line.productId)).map((line) => <option key={line.productId} value={line.productId}>{line.name}</option>)}</select></label><StarRating value={rating} onChange={setRating} /><textarea aria-label="Review comment" value={comment} onChange={(event) => setComment(event.target.value)} required placeholder="Share a useful note for other shoppers…" /><button className="btn" disabled={!rating}>Submit review</button></form></section>}{db.reviews.filter((item) => item.orderId === order.id && item.customerId === user.id).map((item) => <section className="review-form" key={item.id}><h3>Your review</h3><p>{order.items.find((line) => line.productId === item.productId)?.name}</p><StarRating value={item.rating} /><p>{item.comment}</p>{item.response && <p>Farmer response: {item.response}</p>}</section>)}</div><aside className="pickup-slip"><div className="slip-top"><small>PICKUP SLIP</small><b>{order.id}</b></div><div className="pickup-code"><span>{order.id.slice(-4)}</span><small>SHOW THIS AT THE STALL</small></div><div><CalendarDays /><span><small>DATE & TIME</small><b>{order.pickupDate}</b><p>{order.pickupSlot}</p></span></div><div><MapPin /><span><small>LOCATION</small><b>{market?.name}</b><p>{market?.address}</p></span></div>{market && <a className="btn btn--outline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/directions?to=${market?.lat},${market?.lng}`}><Navigation /> Get directions</a>}{order.status === 'ready' && <><button className="btn" onClick={complete}>Confirm collected</button><p>Confirm after collecting and paying at the stall.</p></>}{['placed', 'accepted', 'preparing'].includes(order.status) && <button className="danger-link" onClick={cancel}>Cancel reservation</button>}<p className="slip-note"><Clock3 /> Arrive within your pickup window. The farmer holds reserved stock until closing.</p></aside></div></section></main>
}
