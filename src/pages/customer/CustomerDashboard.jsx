import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Heart, Home, PackageCheck, ShoppingBasket, Sparkles, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import ProductCard from '../../components/shared/ProductCard'
import { useAuth } from '../../context/AuthContext'
import { formatCurrency, statusLabel } from '../../utils/helpers'

export default function CustomerDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('overview')
  const [, refresh] = useState(0)
  const db = api.snapshot()
  const orders = db.orders.filter((item) => item.customerId === user.id)
  const active = orders.filter((item) => !['completed', 'cancelled', 'declined'].includes(item.status))
  const favorites = db.products.filter((item) => user.favorites?.includes(item.id))
  const savedFarmers = db.farmers.filter((farmer) => user.favorites?.includes(farmer.id))
  const notifications = db.notifications.filter((item) => item.userId === user.id)
  const unread = notifications.filter((item) => item.unread).length

  return (
    <main className="portal-page customer-portal">
      <aside className="portal-sidebar">
        <div>
          <p className="eyebrow eyebrow--gold">CUSTOMER PORTAL</p>
          <h2>{user.name}</h2>
          <span className="status-pill status-pill--ready">{active.length ? `${active.length} active pickup${active.length === 1 ? '' : 's'}` : 'All clear'}</span>
        </div>
        <nav>
          <button className={tab === 'overview' ? 'is-active' : ''} onClick={() => setTab('overview')}><BarChart3 /> Overview</button>
          <button className={tab === 'orders' ? 'is-active' : ''} onClick={() => setTab('orders')}><PackageCheck /> Orders <span>{orders.length}</span></button>
          <button className={tab === 'favorites' ? 'is-active' : ''} onClick={() => setTab('favorites')}><Heart /> Favorites <span>{favorites.length + savedFarmers.length}</span></button>
          <button className={tab === 'notifications' ? 'is-active' : ''} onClick={() => setTab('notifications')}><Clock3 /> Notifications <span>{unread}</span></button>
          <button className={tab === 'profile' ? 'is-active' : ''} onClick={() => setTab('profile')}><UserRound /> Profile</button>
          <button onClick={logout}>Logout</button>
        </nav>
        <div className="portal-tip"><ShoppingBasket /><b>Pickup reminder</b><p>Reserve before the farmer cutoff time and pay in person at pickup.</p></div>
      </aside>

      <section className="portal-content">
        <header>
          <div>
            <p className="eyebrow">{tab.toUpperCase()}</p>
            <h1>{tab === 'overview' ? `Good morning, ${user.name.split(' ')[0]}.` : tab === 'orders' ? 'Your market trips.' : tab === 'favorites' ? 'Saved products and farmers.' : tab === 'notifications' ? 'Latest updates.' : 'Profile settings.'}</h1>
          </div>
          <div className="dashboard-head-actions">
            <Link className="btn btn--outline dashboard-home-link" to="/"><Home /> Back to Home</Link>
            <Link className="btn btn--harvest" to="/products"><ShoppingBasket /> Browse fresh stock</Link>
          </div>
        </header>

        {tab === 'overview' && (
          <>
            <div className="portal-metrics">
              <article><span><PackageCheck /></span><small>Active pickups</small><b>{active.length}</b><p>{active.length ? 'One may need attention' : 'Nothing pending'}</p></article>
              <article><span><Heart /></span><small>Saved items</small><b>{user.favorites?.length || 0}</b><p>Products and farmers</p></article>
              <article><span><CheckCircle2 /></span><small>Completed orders</small><b>{orders.filter((item) => item.status === 'completed').length}</b><p>Fresh trips made</p></article>
              <article><span><Clock3 /></span><small>Unread updates</small><b>{unread}</b><p>Notifications waiting</p></article>
            </div>
            <div className="portal-grid">
              <section className="portal-panel">
                <div className="panel-title"><div><p className="eyebrow">NEXT PICKUP</p><h2>Your basket is moving.</h2></div><button onClick={() => setTab('orders')}>View all <ArrowRight /></button></div>
                {active.length ? active.map((order) => <CustomerOrderRow key={order.id} order={order} db={db} />) : <div className="empty-strip"><CheckCircle2 /><span>No active pickup right now.</span></div>}
              </section>
              <section className="portal-panel">
                <div className="panel-title"><div><p className="eyebrow">QUICK FAVORITES</p><h2>Ready to reorder</h2></div><button onClick={() => setTab('favorites')}>Open saved <ArrowRight /></button></div>
                {favorites.slice(0, 3).map((product) => <div className="analytics-row" key={product.id}><span><b>{product.name}</b><small>{formatCurrency(product.price)} / {product.unit}</small></span><Link to={`/products/${product.id}`}>View</Link></div>)}
                {!favorites.length && <div className="empty-strip"><Sparkles /><span>Save products while browsing to see them here.</span></div>}
              </section>
            </div>
          </>
        )}

        {tab === 'orders' && (
          <section className="portal-panel">
            <div className="panel-title"><div><p className="eyebrow">ORDER HISTORY</p><h2>Past and active market trips</h2></div></div>
            <div className="table-wrap"><table><thead><tr><th>Order</th><th>Date</th><th>Pickup</th><th>Status</th><th>Total</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><b>{order.id}</b></td><td>{order.createdAt}</td><td>{db.markets.find((item) => item.id === order.marketId)?.name}</td><td><span className={`status-pill status-pill--${order.status}`}>{statusLabel(order.status)}</span></td><td>{formatCurrency(order.total)}</td><td><Link to={`/customer/orders/${order.id}`}>{order.status === 'completed' ? 'Leave Review / View' : 'View Order'} <ArrowRight /></Link></td></tr>)}</tbody></table></div>
          </section>
        )}

        {tab === 'favorites' && (
          <>
            <section className="portal-panel">
              <div className="panel-title"><div><p className="eyebrow">SAVED PRODUCTS</p><h2>Your favourites</h2></div><Link to="/products">Find more <ArrowRight /></Link></div>
              {favorites.length ? <div className="product-grid">{favorites.map((product) => <ProductCard key={product.id} product={product} farmer={db.farmers.find((item) => item.id === product.farmerId)} favorite />)}</div> : <div className="empty-strip"><Sparkles /><span><b>Start curating your weekly market.</b> Save any product while you browse.</span><Link className="btn btn--outline" to="/products">Explore produce</Link></div>}
            </section>
            <section className="portal-panel">
              <div className="panel-title"><div><p className="eyebrow">SAVED FARMERS</p><h2>Growers you follow</h2></div></div>
              {savedFarmers.length ? savedFarmers.map((farmer) => <div className="analytics-row" key={farmer.id}><span><b>{farmer.name}</b><small>{farmer.specialties?.join(', ')}</small></span><Link to={`/farmers/${farmer.id}`}>View farmer</Link></div>) : <div className="empty-strip"><Heart /><span>No saved farmers yet.</span></div>}
            </section>
          </>
        )}

        {tab === 'notifications' && (
          <section className="portal-panel">
            <div className="panel-title"><div><p className="eyebrow">NOTIFICATIONS</p><h2>{notifications.length} updates</h2></div></div>
            {notifications.length ? notifications.map((item) => <article className="announcement-row" key={item.id}><Clock3 /><div><b>{item.text}</b><small>{item.createdAt}</small></div>{item.unread ? <button className="text-btn" onClick={async () => { await api.notifications.markRead(item.id); refresh((value) => value + 1) }}>Mark Read</button> : <small>Read</small>}</article>) : <div className="empty-strip"><CheckCircle2 /><span>No notifications yet.</span></div>}
          </section>
        )}

        {tab === 'profile' && (
          <section className="portal-panel">
            <div className="panel-title"><div><p className="eyebrow">PROFILE</p><h2>Your account</h2></div></div>
            <div className="profile-summary-grid">
              <p><small>Name</small><b>{user.name}</b></p>
              <p><small>Email</small><b>{user.email}</b></p>
              <p><small>Phone</small><b>{user.phone}</b></p>
              <p><small>Address</small><b>{user.address}</b></p>
            </div>
          </section>
        )}
      </section>
    </main>
  )
}

function CustomerOrderRow({ order, db }) {
  const market = db.markets.find((item) => item.id === order.marketId)
  return (
    <article className="active-order active-order--portal">
      <div className="order-status-icon"><Clock3 /></div>
      <div><span className={`status-pill status-pill--${order.status}`}>{statusLabel(order.status)}</span><h3>Order {order.id}</h3><p>{order.items.map((item) => `${item.quantity}x ${item.name}`).join(' · ')}</p><div><span><CalendarDays />{order.pickupDate}, {order.pickupSlot}</span><span>{market?.name}</span></div></div>
      <strong>{formatCurrency(order.total)}<small>PAY AT PICKUP</small></strong>
      <Link className="icon-btn" to={`/customer/orders/${order.id}`}><ArrowRight /></Link>
    </article>
  )
}
