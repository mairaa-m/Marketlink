import { ArrowLeft, ArrowRight, CalendarDays, Check, Clock3, MapPin, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import { pickupDates } from '../../utils/pickup'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { formatCurrency } from '../../utils/helpers'

const pickupSlots = {
  'm-1': ['9:00â€“9:30 AM', '10:00â€“10:30 AM', '11:00â€“11:30 AM', '12:00â€“12:30 PM'],
  'm-2': ['10:00â€“10:30 AM', '11:00â€“11:30 AM', '12:00â€“12:30 PM', '1:00â€“1:30 PM'],
  'm-3': ['4:30â€“5:00 PM', '5:30â€“6:00 PM', '6:30â€“7:00 PM', '7:00â€“7:30 PM'],
}

export default function PickupCheckoutPage() {
  const { user } = useAuth()
  const { items, total, clearCart, tripCheckout, cancelTrip } = useCart()
  const db = api.snapshot()
  const [marketId, setMarketId] = useState(tripCheckout?.marketId || null)
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  if (!items.length) return <Navigate to='/cart' replace />

  const markets = db.markets.filter((market) => items.every((item) => (
    item.marketIds.includes(market.id) &&
    db.farmers.find((farmer) => farmer.id === item.farmerId)?.marketIds.includes(market.id)
  )))
  const market = markets.find((item) => item.id === marketId) || markets[0]
  const slots = market?.openingTime ? [market.hours] : pickupSlots[market?.id] || [market?.hours || 'Choose a market']
  const dates = pickupDates(market)
  const selectedDate = dates.includes(date) ? date : dates[0]
  const invalidItems = items.some((item) => { const current = db.products.find((product) => product.id === item.id); return !current?.available || current.stock < item.quantity || current.price !== item.price })
  const selectedSlot = slots.includes(slot) ? slot : slots[0]
  const farmerCount = new Set(items.map((item) => item.farmerId)).size

  const placeOrder = async () => {
    if (!market || !selectedDate || invalidItems || placing) return
    setPlacing(true)
    setError('')
    try {
      const orders = await api.orders.createBatch({
        customerId: user.id,
        marketId: market.id,
        pickupDate: selectedDate,
        pickupSlot: selectedSlot,
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      })
      clearCart()
      toast.success(orders.length > 1 ? orders.length + ' farmer reservations placed' : 'Reservation placed')
      navigate(orders.length === 1 ? '/customer/orders/' + orders[0].id : '/customer/dashboard', {
        state: { justPlaced: true },
      })
    } catch (nextError) {
      setError(nextError.message)
      toast.error(nextError.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <main>
      <section className='page-hero page-hero--compact'>
        <div className='shell'>
          <p className='eyebrow eyebrow--gold'>FINAL STEP</p>
          <h1>Choose your <em>pickup.</em></h1>
        </div>
      </section>
      <section className='section section--paper'>
        <div className='shell checkout-layout'>
          <div className='checkout-main'>
            <Link className='back-button' to='/cart'><ArrowLeft /> Back to basket</Link>
            {tripCheckout && <button className='text-btn' onClick={() => { cancelTrip(); navigate('/trip') }}>Cancel trip checkout and restore previous basket</button>}
            <section>
              <div className='checkout-step-title'>
                <span>1</span>
                <div><p className='eyebrow'>PICKUP MARKET</p><h2>Where will you collect?</h2></div>
              </div>
              {markets.length ? (
                <div className='checkout-options'>
                  {markets.map((option) => (
                    <button key={option.id} type='button' onClick={() => { setMarketId(option.id); setSlot(null); setDate('') }} className={market.id === option.id ? 'is-active' : ''}>
                      <span><MapPin /></span>
                      <div><h3>{option.name}</h3><p>{option.day} Â· {option.hours}</p><small>{option.address}</small></div>
                      {market.id === option.id && <Check />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className='checkout-blocked'>
                  <MapPin />
                  <div>
                    <h3>These items do not share a pickup market.</h3>
                    <p>Remove an item or place separate reservations so each basket has a shared market.</p>
                    <Link className='arrow-link' to='/cart'>Edit your basket <ArrowRight /></Link>
                  </div>
                </div>
              )}
            </section>
            {market && (
              <section>
                <div className='checkout-step-title'>
                  <span>2</span>
                  <div><p className='eyebrow'>PICKUP WINDOW</p><h2>When should it be ready?</h2></div>
                </div>
                <label className="pickup-date-label">Pickup Date<select value={selectedDate || ''} onChange={(event) => setDate(event.target.value)}>{dates.map((value) => <option key={value}>{value}</option>)}</select></label>{!dates.length && <p role="alert">No scheduled pickup dates. Choose another market.</p>}<div className='slot-grid'>
                  {slots.map((option) => (
                    <button key={option} type='button' className={selectedSlot === option ? 'is-active' : ''} onClick={() => setSlot(option)}>
                      <Clock3 /> {option} {selectedSlot === option && <Check />}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section>
              <div className='checkout-step-title'>
                <span>3</span>
                <div><p className='eyebrow'>CONTACT DETAILS</p><h2>Who is collecting?</h2></div>
              </div>
              <div className='customer-confirm'>
                <div><small>NAME</small><b>{user.name}</b></div>
                <div><small>PHONE</small><b>{user.phone || 'Add at the stall'}</b></div>
                <div><small>EMAIL</small><b>{user.email}</b></div>
              </div>
            </section>
          </div>
          <aside className='cart-summary checkout-summary'>
            <p className='eyebrow'>RESERVATION SUMMARY</p>
            {items.map((item) => (
              <div className='checkout-item' key={item.id}>
                <span>{item.quantity}Ã—</span>
                <div><b>{item.name}</b><small>{item.unit}</small></div>
                <strong>{formatCurrency(item.price * item.quantity)}</strong>
              </div>
            ))}
            {market && <div className='pickup-summary'>
              <CalendarDays />
              <div><small>SUITABLE PICKUP TIME</small><b>{market.name}</b><span>{selectedDate} · {selectedSlot}</span></div>
            </div>}
            {farmerCount > 1 && <p className='checkout-group-note'>{farmerCount} farmers will prepare separate pickup slips for this basket.</p>}
            <div className='summary-total'><span>Pay at pickup</span><strong>{formatCurrency(total)}</strong></div>
            {invalidItems && <p role="alert">Stock or prices have changed. <Link to="/cart">Review your basket</Link> before reserving.</p>}{error && <p className='form-error'>{error}</p>}
            <button className='btn btn--large' type='button' onClick={placeOrder} disabled={!market || !selectedDate || invalidItems || placing}>
              {placing ? 'Reserving your basketâ€¦' : 'Place reservation'} <ArrowRight />
            </button>
            <p><ShieldCheck /> Stock is reserved when you place the order. Pay each farmer in person.</p>
          </aside>
        </div>
      </section>
    </main>
  )
}


