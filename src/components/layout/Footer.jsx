import { ArrowUpRight, Camera, Leaf, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main shell">
        <div className="footer-intro"><Link to="/" className="brand brand--footer"><span><Leaf /></span><b>MarketLink</b></Link><h2>Food feels different when you know who grew it.</h2><p>Fresh harvests, honest availability, and easy market pickup—directly from the people who farm nearby.</p></div>
        <div className="footer-links"><div><small>EXPLORE</small><Link to="/products">Fresh produce</Link><Link to="/markets">Markets near you</Link><Link to="/farmers">Meet the growers</Link></div><div><small>MARKETLINK</small><Link to="/about">Our story</Link><Link to="/contact">Contact</Link><Link to="/register">Become a farmer</Link></div></div>
        <div className="footer-note"><MapPin /><div><small>BUILT FOR LOCAL PICKUP</small><p>Lahore, Pakistan</p></div></div>
      </div>
      <div className="footer-bottom shell"><span>© 2026 MarketLink. Fresh, local, pickup-only.</span><div><a href="mailto:hello@marketlink.pk"><Mail />Email</a><a href="https://instagram.com" target="_blank" rel="noreferrer"><Camera />Instagram <ArrowUpRight /></a></div></div>
    </footer>
  )
}
