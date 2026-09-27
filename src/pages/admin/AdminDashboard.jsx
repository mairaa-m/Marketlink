import {
  BarChart3,
  Check,
  Clock3,
  Download,
  Eye,
  Home,
  Layers,
  MapPin,
  Megaphone,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Star,
  Store,
  Tag,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
import useLocalStorage from '../../hooks/useLocalStorage'
import { formatCurrency } from '../../utils/helpers'
import { downloadReport } from '../../utils/reports'
import MarketManager from './MarketManager'

const CATEGORY_SEED = ['Vegetables', 'Fruit', 'Bakery', 'Dairy', 'Eggs', 'Other Produce']
const ANNOUNCEMENT_SEED = [
  { id: 'a-1', title: 'Saturday market opens at 8 AM sharp', date: '24 Sep 2026' },
  { id: 'a-2', title: 'New reserved-order lane at DHA Evening Hall', date: '19 Sep 2026' },
]

const tabs = [
  ['overview', 'Overview', BarChart3],
  ['farmers', 'Farmers', Store],
  ['users', 'Users', Users],
  ['markets', 'Markets', MapPin],
  ['categories', 'Categories', Tag],
  ['listings', 'Listings', Layers],
  ['reviewMod', 'Reviews', MessageSquareWarning],
  ['announcements', 'Announcements', Megaphone],
  ['reports', 'Reports', Download],
]

const tabTitle = {
  overview: 'The market at a glance.',
  farmers: 'Farmer approvals.',
  users: 'Customer accounts.',
  markets: 'Market locations.',
  categories: 'Category management.',
  listings: 'Listing moderation.',
  reviewMod: 'Review moderation.',
  announcements: 'Announcements.',
  reports: 'Reports & exports.',
}

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [, setVersion] = useState(0)
  const [tab, setTab] = useState('overview')
  const [farmerSearch, setFarmerSearch] = useState('')
  const [farmerStatus, setFarmerStatus] = useState('all')
  const [listingStatus, setListingStatus] = useState('all')
  const [userSearch, setUserSearch] = useState('')
  const db = api.snapshot()

  const revenue = db.orders.reduce((sum, item) => sum + item.total, 0)
  const pendingFarmers = db.farmers.filter((item) => item.status === 'pending')
  const activeCustomers = db.users.filter((item) => item.role === 'customer' && item.status !== 'suspended')
  const metrics = [
    { label: 'Pending approvals', value: pendingFarmers.length, change: 'Need admin review', icon: ShieldCheck },
    { label: 'Registered farmers', value: db.farmers.length, change: `${db.farmers.filter((item) => item.status === 'approved').length} approved`, icon: Store },
    { label: 'Active customers', value: activeCustomers.length, change: `${db.users.filter((item) => item.role === 'customer').length} total customers`, icon: Users },
    { label: 'Market revenue', value: formatCurrency(revenue), change: 'Paid directly to growers', icon: BarChart3 },
  ]

  const chart = useMemo(() => [48, 62, 55, 82, 69, 96, 88], [])
  const [categories, setCategories] = useLocalStorage('marketlink_categories', CATEGORY_SEED)
  const [newCategory, setNewCategory] = useState('')
  const [announcements, setAnnouncements] = useLocalStorage('marketlink_announcements', ANNOUNCEMENT_SEED)
  const [newAnnouncement, setNewAnnouncement] = useState('')

  const refresh = () => setVersion((value) => value + 1)
  const statusFarmer = async (id, status) => {
    await api.admin.updateFarmerStatus(id, status)
    refresh()
    toast.success(status === 'approved' ? 'Farmer approved and can publish products' : 'Farmer suspended')
  }
  const assignMarket = async (farmer, marketId) => {
    if (!marketId || farmer.marketIds.includes(marketId)) return
    await api.admin.updateFarmerProfile(farmer.id, { marketIds: [...farmer.marketIds, marketId] })
    refresh()
    toast.success('Market assigned to farmer')
  }
  const removeMarket = async (farmer, marketId) => {
    await api.admin.updateFarmerProfile(farmer.id, { marketIds: farmer.marketIds.filter((id) => id !== marketId) })
    refresh()
    toast.success('Market removed from farmer')
  }
  const toggleFeaturedFarmer = async (farmer) => {
    await api.admin.updateFarmerProfile(farmer.id, { featured: !farmer.featured })
    refresh()
    toast.success(!farmer.featured ? 'Farmer added to home featured list' : 'Farmer removed from home featured list')
  }
  const toggleUser = async (user) => {
    const next = user.status === 'suspended' ? 'active' : 'suspended'
    await api.admin.updateUserStatus(user.id, next)
    refresh()
    toast.success(next === 'active' ? 'User activated' : 'User suspended')
  }
  const addCategory = () => {
    const value = newCategory.trim()
    if (!value || categories.includes(value)) return
    setCategories((current) => [...current, value])
    setNewCategory('')
    toast.success('Category added')
  }
  const removeCategory = (name) => setCategories((current) => current.filter((item) => item !== name))
  const toggleListing = async (id) => {
    const product = db.products.find((item) => item.id === id)
    await api.products.update(id, { available: !product.available && product.stock > 0 })
    refresh()
    toast.success('Listing availability updated')
  }
  const removeReview = (id) => {
    api.reviews.remove(id)
    refresh()
    toast.success('Review removed')
  }
  const publishAnnouncement = () => {
    const value = newAnnouncement.trim()
    if (!value) return
    api.announcements.publish(value)
    setAnnouncements((current) => [{ id: `a-${Date.now()}`, title: value, date: 'Today' }, ...current])
    setNewAnnouncement('')
    toast.success('Announcement published')
  }

  const farmers = db.farmers
    .filter((farmer) => farmerStatus === 'all' || farmer.status === farmerStatus)
    .filter((farmer) => `${farmer.name} ${farmer.owner} ${farmer.specialties.join(' ')}`.toLowerCase().includes(farmerSearch.toLowerCase()))
  const users = db.users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(userSearch.toLowerCase()))
  const listings = db.products.filter((product) => {
    if (listingStatus === 'live') return product.available
    if (listingStatus === 'hidden') return !product.available
    if (listingStatus === 'soldout') return product.stock <= 0
    return true
  })

  return (
    <main className="portal-page admin-portal admin-portal--refined">
      <aside className="portal-sidebar">
        <div>
          <p className="eyebrow eyebrow--gold">ADMIN CONSOLE</p>
          <h2>MarketLink</h2>
          <span className="status-pill status-pill--ready">System healthy</span>
        </div>
        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
              <Icon /> {label}
              {id === 'farmers' && pendingFarmers.length > 0 && <span>{pendingFarmers.length}</span>}
            </button>
          ))}
          <button onClick={logout}>Logout</button>
        </nav>
        <div className="portal-tip">
          <ShieldCheck />
          <b>Admin actions are live</b>
          <p>Approvals, account status, listings and announcements persist in this browser.</p>
        </div>
      </aside>

      <section className="portal-content">
        <header>
          <div>
            <p className="eyebrow">PLATFORM CONTROL</p>
            <h1>{tabTitle[tab]}</h1>
          </div>
          <div className="dashboard-head-actions">
            <Link className="btn btn--outline dashboard-home-link" to="/"><Home /> Back to Home</Link>
            {tab !== 'announcements' && <button className="btn btn--outline" onClick={() => setTab('announcements')}><Megaphone /> Publish notice</button>}
          </div>
        </header>

        {tab === 'overview' && (
          <>
            <div className="portal-metrics">{metrics.map(({ label, value, change, icon: Icon }) => <article key={label}><span><Icon /></span><small>{label}</small><b>{value}</b><p>{change}</p></article>)}</div>
            <div className="admin-grid">
              <section className="portal-panel">
                <div className="panel-title"><div><p className="eyebrow">WEEKLY ACTIVITY</p><h2>Orders by day</h2></div><b>{db.orders.length} total</b></div>
                <div className="bar-chart">{chart.map((height, index) => <div key={index}><span style={{ height: `${height}%` }} /><small>{['Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed'][index]}</small></div>)}</div>
              </section>
              <section className="portal-panel">
                <div className="panel-title"><div><p className="eyebrow">NEEDS REVIEW</p><h2>Pending farmers</h2></div><button onClick={() => setTab('farmers')}>Manage all</button></div>
                {pendingFarmers.map((farmer) => <AdminFarmerCard key={farmer.id} farmer={farmer} db={db} onStatus={statusFarmer} onToggleFeatured={toggleFeaturedFarmer} compact />)}
                {!pendingFarmers.length && <div className="empty-strip"><Check /><span>All farmer profiles are reviewed.</span></div>}
              </section>
            </div>
          </>
        )}

        {tab === 'farmers' && (
          <section className="portal-panel admin-control-panel">
            <div className="panel-title">
              <div><p className="eyebrow">FARMER APPROVALS</p><h2>{farmers.length} farmer profiles</h2></div>
              <div className="admin-filters">
                <label><Search /><input value={farmerSearch} onChange={(event) => setFarmerSearch(event.target.value)} placeholder="Search farmer or owner" /></label>
                <select value={farmerStatus} onChange={(event) => setFarmerStatus(event.target.value)}>
                  <option value="all">All status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
            <div className="admin-farmer-grid">
              {farmers.map((farmer) => <AdminFarmerCard key={farmer.id} farmer={farmer} db={db} onStatus={statusFarmer} onAssignMarket={assignMarket} onRemoveMarket={removeMarket} onToggleFeatured={toggleFeaturedFarmer} />)}
            </div>
            {!farmers.length && <div className="empty-state"><Store /><h2>No farmers found</h2><p>Try another search or status filter.</p></div>}
          </section>
        )}

        {tab === 'users' && (
          <section className="portal-panel admin-control-panel">
            <div className="panel-title">
              <div><p className="eyebrow">USER MANAGEMENT</p><h2>Activate or suspend accounts</h2></div>
              <label className="admin-search"><Search /><input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users" /></label>
            </div>
            <div className="admin-user-grid">
              {users.map((user) => <article key={user.id} className="admin-user-card"><span>{user.name.slice(0, 2).toUpperCase()}</span><div><b>{user.name}</b><small>{user.email}</small><p>{user.role}</p></div><span className={`status-pill ${user.status === 'suspended' ? 'status-pill--suspended' : 'status-pill--ready'}`}>{user.status || 'active'}</span><button className="btn btn--outline btn--small" onClick={() => toggleUser(user)}>{user.status === 'suspended' ? 'Activate' : 'Suspend'}</button></article>)}
            </div>
          </section>
        )}

        {tab === 'markets' && <MarketManager markets={db.markets} onChange={refresh} />}

        {tab === 'categories' && (
          <section className="portal-panel">
            <div className="panel-title"><div><p className="eyebrow">STORE CATEGORIES</p><h2>{categories.length} active categories</h2></div></div>
            <form className="inline-add-form" onSubmit={(event) => { event.preventDefault(); addCategory() }}>
              <input aria-label="New category name" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category name" />
              <button className="btn btn--small" type="submit">Add</button>
            </form>
            <div className="tag-chip-list">{categories.map((category) => <span key={category} className="tag-chip">{category}<button disabled={db.products.some((product) => product.category === category)} title={db.products.some((product) => product.category === category) ? 'Category is used by existing products' : 'Remove category'} onClick={() => removeCategory(category)} aria-label={`Remove ${category}`}><X /></button></span>)}</div>
          </section>
        )}

        {tab === 'listings' && (
          <section className="portal-panel admin-control-panel">
            <div className="panel-title">
              <div><p className="eyebrow">LISTING MODERATION</p><h2>{listings.length} listings</h2></div>
              <select value={listingStatus} onChange={(event) => setListingStatus(event.target.value)}>
                <option value="all">All listings</option>
                <option value="live">Live</option>
                <option value="hidden">Hidden</option>
                <option value="soldout">Sold out</option>
              </select>
            </div>
            <div className="admin-listing-grid">
              {listings.map((product) => {
                const farmer = db.farmers.find((item) => item.id === product.farmerId)
                const hidden = !product.available
                return (
                  <article key={product.id} className="admin-listing-card">
                    <img src={product.image} alt={product.name} />
                    <div><b>{product.name}</b><small>{farmer?.name} · {product.category}</small><p>{formatCurrency(product.price)} / {product.unit} · {product.stock} left</p></div>
                    <span className={`status-pill ${hidden ? 'status-pill--cancelled' : 'status-pill--ready'}`}>{hidden ? 'Unavailable' : 'Live'}</span>
                    <button className="btn btn--outline btn--small" disabled={hidden && product.stock <= 0} onClick={() => toggleListing(product.id)}>{hidden ? 'Restore' : 'Hide'}</button>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {tab === 'reviewMod' && (
          <section className="portal-panel">
            <div className="panel-title"><div><p className="eyebrow">FLAGGED & RECENT REVIEWS</p><h2>Moderate customer feedback</h2></div></div>
            <div className="farmer-reviews-list">{db.reviews.map((review) => { const product = db.products.find((item) => item.id === review.productId); return <article key={review.id} className="farmer-review-row"><div className="farmer-review-head"><b>{product?.name}</b><span>{review.date}</span></div><p>"{review.comment}" — {review.customer}</p><footer><span>Rating: {review.rating}/5</span><button className="text-btn" onClick={() => removeReview(review.id)}>Remove review</button></footer></article> })}{!db.reviews.length && <div className="empty-strip"><Check /><span>No reviews pending moderation.</span></div>}</div>
          </section>
        )}

        {tab === 'announcements' && (
          <section className="portal-panel">
            <div className="panel-title"><div><p className="eyebrow">PLATFORM ANNOUNCEMENTS</p><h2>Visible to all customers</h2></div></div>
            <form className="inline-add-form" onSubmit={(event) => { event.preventDefault(); publishAnnouncement() }}>
              <input aria-label="New announcement" value={newAnnouncement} onChange={(event) => setNewAnnouncement(event.target.value)} placeholder="Write a new announcement" />
              <button className="btn btn--small" type="submit"><Megaphone /> Publish</button>
            </form>
            <div className="announcement-list">{announcements.map((item) => <article key={item.id} className="announcement-row"><Clock3 /><div><b>{item.title}</b><small>{item.date}</small></div></article>)}</div>
          </section>
        )}

        {tab === 'reports' && <section className="reports-grid">{['Market activity report', 'Farmer revenue summary', 'Customer growth report', 'Inventory availability report'].map((report) => <article key={report}><Download /><h2>{report}</h2><p>Generated from current MarketLink demo data.</p><button className="btn btn--outline" onClick={() => downloadReport(report, db)}>Generate CSV</button></article>)}</section>}
      </section>
    </main>
  )
}

function AdminFarmerCard({ farmer, db, onStatus, onAssignMarket, onRemoveMarket, onToggleFeatured, compact = false }) {
  const farmerProducts = db.products.filter((item) => item.farmerId === farmer.id)
  const farmerOrders = db.orders.filter((item) => item.farmerId === farmer.id)
  const markets = db.markets.filter((market) => farmer.marketIds.includes(market.id))
  const availableMarkets = db.markets.filter((market) => !farmer.marketIds.includes(market.id))
  const sales = farmerOrders.reduce((sum, order) => sum + order.total, 0)

  return (
    <article className={compact ? 'admin-farmer-card admin-farmer-card--compact' : 'admin-farmer-card'}>
      <div className="admin-farmer-card__head">
        <span>{farmer.initials}</span>
        <div>
          <b>{farmer.name} {farmer.featured && <em className="admin-featured-mark"><Star /> Featured</em>}</b>
          <small>{farmer.owner} · {farmer.liveLocation || 'Location not set'}</small>
        </div>
        <span className={`status-pill status-pill--${farmer.status}`}>{farmer.status}</span>
      </div>
      <p>{farmer.bio}</p>
      <div className="admin-mini-metrics">
        <span><b>{farmerProducts.length}</b><small>Listings</small></span>
        <span><b>{farmerOrders.length}</b><small>Orders</small></span>
        <span><b>{formatCurrency(sales)}</b><small>Sales</small></span>
      </div>
      {!compact && (
        <>
          <div className="admin-market-chips">
            {markets.map((market) => <button key={market.id} onClick={() => onRemoveMarket(farmer, market.id)} title="Remove market">{market.name}<X /></button>)}
            {!markets.length && <small>No markets assigned</small>}
          </div>
          <select aria-label={`Assign market to ${farmer.name}`} defaultValue="" onChange={(event) => { onAssignMarket(farmer, event.target.value); event.target.value = '' }}>
            <option value="" disabled>Assign pickup market</option>
            {availableMarkets.map((market) => <option key={market.id} value={market.id}>{market.name}</option>)}
          </select>
        </>
      )}
      <footer>
        <Link className="btn btn--outline btn--small" to={`/farmers/${farmer.id}`}><Eye /> View</Link>
        <button className="btn btn--outline btn--small" disabled={farmer.status !== 'approved'} onClick={() => onToggleFeatured?.(farmer)}><Star /> {farmer.featured ? 'Unfeature' : 'Feature'}</button>
        <button className="btn btn--small" disabled={farmer.status === 'approved'} onClick={() => onStatus(farmer.id, 'approved')}><Check /> Approve</button>
        <button className="btn btn--outline btn--small" disabled={farmer.status === 'suspended'} onClick={() => onStatus(farmer.id, 'suspended')}><X /> Suspend</button>
      </footer>
    </article>
  )
}
