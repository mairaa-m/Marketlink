import { ArrowRight, Check, Leaf, LockKeyhole, ShoppingBasket, Store, UserCog } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const demos = [
  { role: 'Customer', icon: ShoppingBasket, email: 'customer@marketlink.demo', password: 'demo123', note: 'Browse, reserve & review' },
  { role: 'Farmer', icon: Store, email: 'farmer@marketlink.demo', password: 'demo123', note: 'Stock & order portal' },
  { role: 'Admin', icon: UserCog, email: 'admin123@gmail.com', password: 'admin123', note: 'Platform control room' },
]

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const submit = async (event, demoEmail) => {
    event?.preventDefault?.()
    setError('')
    try {
      const demo = demos.find((item) => item.email === demoEmail)
      const user = await login(demoEmail || email, demo ? demo.password : password)
      navigate(location.state?.from || `/${user.role}/dashboard`)
    } catch (nextError) { setError(nextError.message) }
  }
  return <main className="auth-page"><section className="auth-visual"><div className="auth-orb auth-orb--one" /><div className="auth-orb auth-orb--two" /><Link to="/" className="brand brand--light"><span><Leaf /></span><b>MarketLink</b></Link><div className="auth-quote"><p className="eyebrow eyebrow--gold">WELCOME BACK TO MARKET DAY</p><h1>Good food is <em>waiting.</em></h1><p>Return to your saved farmers, pickup orders and weekly favourites.</p><div><span><Check /> Live farmer stock</span><span><Check /> No online payment</span><span><Check /> Pickup made predictable</span></div></div></section><section className="auth-form-wrap"><div className="auth-form"><div><p className="eyebrow">SECURE ACCOUNT ACCESS</p><h2>Log in</h2><p>New to MarketLink? <Link to="/register">Create a free account</Link></p></div><form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required /></label>{error && <p className="form-error">{error}</p>}<button className="btn btn--large" disabled={loading}>{loading ? 'Opening your account…' : 'Log in'} <ArrowRight /></button></form><div className="demo-divider"><span>OR USE A DEMO ACCOUNT</span></div><div className="demo-logins">{demos.map(({ role, icon: Icon, email: demoEmail, note }) => <button key={role} onClick={() => submit(null, demoEmail)}><Icon /><span><b>{role}</b><small>{note}</small></span><ArrowRight /></button>)}</div><div className="secure-note"><LockKeyhole /> Demo data stays in this browser and can be reset anytime.</div></div></section></main>
}
