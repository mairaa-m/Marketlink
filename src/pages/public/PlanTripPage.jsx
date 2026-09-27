import { Check, MapPin, Minus, Plus, Route, ShoppingBasket, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api'
import { useCart } from '../../context/CartContext'
import useLocalStorage from '../../hooks/useLocalStorage'
import { formatCurrency } from '../../utils/helpers'
import { catalogTypes, planForMarket, quantityLabel } from '../../utils/trip'

export default function PlanTripPage() {
  const db = api.snapshot()
  const { setTripItems } = useCart()
  const navigate = useNavigate()
  const [list, setList] = useLocalStorage('marketlink_trip_list_v2', [])
  const [category, setCategory] = useState('Vegetables')
  const [selectedMarketId, setSelectedMarketId] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [showRoute, setShowRoute] = useState(false)
  const types = catalogTypes(db)
  const plans = db.markets.map((market) => planForMarket(db, market, list)).sort((a, b) => b.foundCount - a.foundCount || a.stops.length - b.stops.length || a.total - b.total)
  const active = plans.find((plan) => plan.market.id === selectedMarketId) || plans[0]
  const change = (type, delta) => {
    setList((current) => {
      const existing = current.find((item) => item.key === type.key)
      const quantity = Math.max(0, (existing?.quantity || 0) + delta)
      return quantity ? existing ? current.map((item) => item.key === type.key ? { ...item, quantity } : item) : [...current, { ...type, quantity }] : current.filter((item) => item.key !== type.key)
    })
    setShowResults(false); setShowRoute(false); setSelectedMarketId(null)
  }
  const reserve = () => {
    setTripItems(active.picks.filter((pick) => pick.product).map((pick) => ({ ...pick.product, quantity: pick.quantity })), active.market.id)
    navigate('/checkout')
  }
  return <main>
    <section className="page-hero page-hero--compact"><div className="shell"><p className="eyebrow eyebrow--gold">PLAN MY MARKET TRIP</p><h1>One list. <em>One good trip.</em></h1><p>Choose products and quantities. Compare demo stock across markets and collect from each farmer.</p></div></section>
    <section className="section section--paper section--compact"><div className="shell">
      <div className="filter-pills filter-pills--catalog">{['Vegetables', 'Fruits', 'Dairy', 'Eggs', 'Bakery', 'Other Produce'].map((name) => <button key={name} aria-pressed={category === name} className={category === name ? 'is-active' : ''} onClick={() => setCategory(name)}>{name}</button>)}</div>
      <div className="trip-product-picker">{types.filter((type) => type.category === category).map((type) => <button className="btn btn--outline" key={type.key} onClick={() => change(type, 1)}><Plus /> {type.name} <small>({type.unit})</small></button>)}</div>
      <div className="trip-layout">
        <aside className="trip-list-card"><p className="eyebrow">MY LIST</p><h2>{list.length} items</h2>
          {!list.length && <p>Choose a category, then add products above.</p>}
          <ul className="trip-list">{list.map((item) => <li key={item.key}><div><b>{item.name}</b><small>{quantityLabel(item)}</small><div className="quantity"><button aria-label={`Less ${item.name}`} onClick={() => change(item, -1)}><Minus /></button><b>{item.quantity}</b><button aria-label={`More ${item.name}`} onClick={() => change(item, 1)}><Plus /></button></div></div><button aria-label={`Remove ${item.name}`} onClick={() => change(item, -item.quantity)}><Trash2 /></button></li>)}</ul>
          <button className="btn trip-find" disabled={!list.length} onClick={() => { setShowResults(true); setShowRoute(false) }}>Find Market</button>
        </aside>
        <div className="trip-results" aria-live="polite">{showResults && active ? <>
          <p className="eyebrow">YOUR MARKET TRIP</p><h2>Recommended Market</h2>
          <div className="trip-market-tabs">{plans.map((plan) => <button key={plan.market.id} className={active.market.id === plan.market.id ? 'is-active' : ''} onClick={() => { setSelectedMarketId(plan.market.id); setShowRoute(false) }}>{plan.market.name}<span>{plan.foundCount}/{list.length}</span></button>)}</div>
          <article className="trip-plan-card"><header><div><h3>{active.market.name}</h3><p><MapPin />{active.market.address}</p></div><b>{active.foundCount}/{list.length} Items Available</b></header>
            {active.foundCount < list.length && <p className="form-error">Partial availability: missing items are excluded from the total and reservation. Check another market above.</p>}
            <p>{active.stops.length} farmers required · {active.stops.length} stops</p>
            {active.stops.map((stop, index) => <section key={stop.farmer.id}><h3>STOP {index + 1} — {stop.farmer.name}</h3>{stop.picks.map((pick) => <div className="trip-plan-item" key={pick.key}><Check className="ok" /><div><b>{pick.name} — {quantityLabel(pick)}</b><p>{pick.product.name} · {formatCurrency(pick.product.price)}/{pick.unit} · Stock: {pick.product.stock} {pick.unit}</p><p>{formatCurrency(pick.product.price * pick.quantity)}</p></div></div>)}</section>)}
            {active.picks.filter((pick) => !pick.product).map((pick) => <div className="trip-plan-item" key={pick.key}><X className="missing" /><div><b>{pick.name} — {quantityLabel(pick)}</b><p>Not enough stock at this market for the requested quantity.</p></div></div>)}
            <footer><div className="trip-plan-stats"><div><small>ESTIMATED TOTAL</small><b>{formatCurrency(active.total)}</b></div><div><small>PICKUP WINDOW</small><b>{active.market.day} · {active.market.hours}</b></div></div><div className="trip-plan-actions"><button className="btn" disabled={!active.foundCount} onClick={reserve}><ShoppingBasket />Reserve Items</button><button className="btn btn--outline" onClick={() => setShowRoute(!showRoute)}><Route />View Route</button><button className="btn btn--outline" onClick={() => { setShowResults(false); setShowRoute(false) }}>Edit List</button></div></footer>
            <p className="trip-note">Review and place your reservation at checkout. This trip becomes your checkout basket; your previous basket is saved until you finish or cancel.</p>
            {showRoute && <section className="trip-route"><h3>Your collection route</h3><p>Market Entrance — {active.market.address}</p><ol>{active.stops.map((stop) => <li key={stop.farmer.id}><span aria-hidden="true">↓</span><b>{stop.farmer.name}</b><p>Collect {stop.picks.map((pick) => `${pick.name} (${quantityLabel(pick)})`).join(', ')}</p></li>)}</ol><p>↓ Pickup Complete{active.foundCount < list.length ? ' — available items only' : ''}</p><p>This is a collection checklist. Ask at the entrance for stall locations.</p><a className="btn btn--outline" href={`https://www.openstreetmap.org/directions?to=${active.market.lat},${active.market.lng}`} target="_blank" rel="noreferrer">Directions to market</a></section>}
          </article>
        </> : <div className="empty-state"><ShoppingBasket /><h2>{showResults ? 'No market available' : 'Build your market list'}</h2>{showResults && <button className="btn" onClick={() => setShowResults(false)}>Edit My List</button>}<p>Use +/− to change quantities, then choose Find Market.</p></div>}</div>
      </div>
    </div></section>
  </main>
}
