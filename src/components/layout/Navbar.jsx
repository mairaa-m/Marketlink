import { LayoutDashboard, Leaf, LogOut, Menu, Settings, ShoppingBasket, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import NotificationDropdown from '../shared/NotificationDropdown'

const links = [
  ['/', 'Home'],
  ['/collections', 'Collections'],
  ['/products', 'Fresh Produce'],
  ['/markets', 'Markets'],
  ['/farmers', 'Farmers'],
  ['/trip', 'Plan My Trip'],
  ['/about', 'Our Story'],
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { count } = useCart()
  const { pathname } = useLocation()
  const onHero = pathname === '/'
  const dashboardPath = user ? `/${user.role}/dashboard` : '/login'
  const cartPath = user?.role === 'farmer' ? '/farmer/dashboard?tab=orders' : '/cart'
  const cartLabel = user?.role === 'farmer' ? 'View customer orders' : `Basket with ${count} items`
  return (
    <header onKeyDown={(event) => { if (event.key === 'Escape') { setOpen(false); setProfileOpen(false) } }} className={`site-nav ${onHero ? 'site-nav--hero' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="brand" onClick={() => setOpen(false)}><span><Leaf /></span><b>MarketLink</b></Link>
        <nav id="main-navigation" aria-label="Main navigation" className={open ? 'nav-links is-open' : 'nav-links'}>
          {links.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}>{label}</NavLink>)}
          <div className="mobile-actions">
            {user ? <><Link className="btn btn--ghost" to={dashboardPath}><LayoutDashboard /> Dashboard</Link><Link className="btn btn--ghost" to={`${dashboardPath}#profile`}><Settings /> Profile</Link><Link className="btn btn--ghost" to={cartPath}><ShoppingBasket /> {user.role === 'farmer' ? 'Orders' : 'Basket'}</Link><button className="btn" onClick={logout}><LogOut /> Logout</button></> : <><Link className="btn btn--ghost" to="/login">Log in</Link><Link className="btn" to="/register">Join now</Link></>}
          </div>
        </nav>
        <div className="nav-actions">
          {user && <NotificationDropdown />}
          {user ? <div className="profile-menu" onMouseEnter={() => setProfileOpen(true)} onMouseLeave={() => setProfileOpen(false)} onFocus={() => setProfileOpen(true)}>
            <Link className="nav-user" to={dashboardPath} aria-haspopup="menu" aria-expanded={profileOpen}><UserRound />{user.name.split(' ')[0]}</Link>
            {profileOpen && <div className="profile-panel" role="menu" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setProfileOpen(false) }}>
              <Link role="menuitem" to={dashboardPath}><LayoutDashboard /> Dashboard</Link>
              <Link role="menuitem" to={`${dashboardPath}#profile`}><Settings /> Profile settings</Link>
              <button role="menuitem" onClick={logout}><LogOut /> Logout</button>
            </div>}
          </div> : <><Link className="text-btn" to="/login">Log in</Link><Link className="btn btn--harvest" to="/register">Join MarketLink</Link></>}
          <Link className="cart-button" to={cartPath} aria-label={cartLabel}><ShoppingBasket />{user?.role === 'farmer' ? <span>!</span> : count > 0 && <span>{count}</span>}</Link>
        </div>
        <button className="menu-btn" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open} aria-controls="main-navigation">{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  )
}
