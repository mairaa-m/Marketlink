import { Bell, CalendarClock, Check, CheckCheck, Megaphone, PackageCheck, RefreshCw, Truck, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'
const ICONS = { ready: PackageCheck, accepted: Truck, restock: RefreshCw, reminder: CalendarClock, announcement: Megaphone }
const LABELS = { ready: 'Ready for Pickup', accepted: 'Order Accepted', restock: 'Restocked', reminder: 'Pickup Reminder', announcement: 'Announcement' }
const orderPath = (user, orderId) => user?.role === 'customer' ? `/customer/orders/${orderId}` : `/${user?.role || 'customer'}/dashboard${user?.role === 'farmer' ? '?tab=orders' : ''}`
export default function NotificationDropdown() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)
  const toggle = useRef(null)
  const refresh = useCallback(async () => {
    if (!user) return
    try { setItems(await api.notifications.list(user.id)); setError('') } catch { setError('Could not load notifications.') } finally { setLoading(false) }
  }, [user])
  useEffect(() => {
    const timer = setTimeout(refresh, 0)
    window.addEventListener('marketlink:data', refresh)
    return () => { clearTimeout(timer); window.removeEventListener('marketlink:data', refresh) }
  }, [refresh])
  useEffect(() => {
    const outside = (event) => { if (ref.current && !ref.current.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])
  if (!user) return null
  const unread = items.filter((item) => item.unread).length
  const close = () => { setOpen(false); toggle.current?.focus() }
  const mark = async (id) => {
    try { if (id) await api.notifications.markRead(id); else await api.notifications.markAllRead(user.id); await refresh() } catch { setError('Could not update notifications. Try again.') }
  }
  return <div className="notif-wrap" ref={ref} onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
    <button ref={toggle} className="icon-btn notif-toggle" onClick={() => setOpen(!open)} aria-label={`Notifications, ${unread} unread`} aria-expanded={open} aria-controls="notifications-panel"><Bell />{unread > 0 && <span className="notif-count">{unread}</span>}</button>
    {open && <div id="notifications-panel" className="notif-panel" role="region" aria-label="Notifications"><header><div><b>Notifications</b><small>{unread ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'All caught up'}</small></div><button className="icon-btn" aria-label="Close notifications" onClick={close}><X /></button></header>{unread > 0 && <button className="text-btn notif-read-all" onClick={() => mark()}><CheckCheck /> Mark all read</button>}
      {error && <p role="alert">{error} <button className="text-btn" onClick={refresh}>Try Again</button></p>}
      <div className="notif-list">{loading ? <p role="status">Loading notifications...</p> : items.length ? items.map((item) => { const Icon = ICONS[item.type] || Bell; return <article key={item.id} className={item.unread ? 'notif-item is-unread' : 'notif-item'}><span className={`notif-icon notif-icon--${item.type}`}><Icon /></span><div><b>{LABELS[item.type] || 'Update'}{item.unread && <i>New</i>}</b><p>{item.text}</p><small>{item.createdAt}</small><div className="notif-actions">{item.orderId && <Link onClick={close} to={orderPath(user, item.orderId)}>View order</Link>}{item.productId && <Link onClick={close} to={`/products/${item.productId}`}>View product</Link>}</div></div>{item.unread && <button className="icon-btn" aria-label={`Mark ${LABELS[item.type] || 'notification'} as read`} onClick={() => mark(item.id)}><Check /></button>}</article> }) : <div className="notif-empty"><Bell /><p>You're all caught up.</p></div>}</div>
    </div>}
  </div>
}
