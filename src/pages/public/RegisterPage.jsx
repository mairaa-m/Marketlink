import { ArrowLeft, ArrowRight, Check, Leaf, LocateFixed, ShoppingBasket, Store } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function RegisterPage() {
  const [role, setRole] = useState('customer')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', businessName: '', liveLocation: '', lat: '', lng: '' })
  const { register, loading } = useAuth()
  const navigate = useNavigate()

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value })
  const useLiveLocation = () => {
    if (!navigator.geolocation) {
      setError('Live location is not supported in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      setForm((current) => ({ ...current, liveLocation: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`, lat: coords.latitude, lng: coords.longitude }))
      setError('')
    }, () => setError('Could not read live location. Enter the market location manually.'))
  }
  const submit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const user = await register({ ...form, role })
      navigate(`/${user.role}/dashboard`)
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  return (
    <main className="register-page">
      <header>
        <Link to="/" className="brand"><span><Leaf /></span><b>MarketLink</b></Link>
        <span>Already joined? <Link to="/login">Log in</Link></span>
      </header>
      <div className="register-shell">
        <div className="register-progress"><span className={step >= 1 ? 'is-active' : ''}>1 <b>Your role</b></span><i /><span className={step >= 2 ? 'is-active' : ''}>2 <b>Your details</b></span></div>
        {step === 1 ? (
          <section className="role-step">
            <p className="eyebrow">JOIN THE HARVEST</p>
            <h1>How will you use <em>MarketLink?</em></h1>
            <p>Choose your path. You can always contact us if your needs change.</p>
            <div className="role-cards">
              <button className={role === 'customer' ? 'is-active' : ''} onClick={() => setRole('customer')}>
                <span><ShoppingBasket /></span><small>FOR SHOPPERS</small><h2>Find local food</h2>
                <p>Discover what's fresh, reserve a basket and collect it at the market.</p>
                <ul><li><Check /> Save products and farmers</li><li><Check /> Track every pickup</li><li><Check /> Review after collection</li></ul>
              </button>
              <button className={role === 'farmer' ? 'is-active' : ''} onClick={() => setRole('farmer')}>
                <span><Store /></span><small>FOR GROWERS & MAKERS</small><h2>Sell your harvest</h2>
                <p>Share weekly stock, manage pre-orders and build loyal relationships.</p>
                <ul><li><Check /> Control live inventory</li><li><Check /> Manage pickup windows</li><li><Check /> See simple sales insights</li></ul>
              </button>
            </div>
            <button className="btn btn--large register-next" onClick={() => setStep(2)}>Continue as {role === 'customer' ? 'a customer' : 'a farmer'} <ArrowRight /></button>
          </section>
        ) : (
          <section className="details-step">
            <button className="back-button" onClick={() => setStep(1)}><ArrowLeft /> Change account type</button>
            <p className="eyebrow">YOUR DETAILS</p>
            <h1>{role === 'farmer' ? 'Bring your harvest online.' : 'Your market, remembered.'}</h1>
            <form onSubmit={submit}>
              <div className="form-grid">
                <label>Full name<input name="name" value={form.name} onChange={change} required placeholder="Your full name" /></label>
                {role === 'farmer' && <label>Stall or business name<input name="businessName" value={form.businessName} onChange={change} required placeholder="e.g. Willow & Root Farm" /></label>}
                <label>Email address<input name="email" type="email" value={form.email} onChange={change} required placeholder="you@example.com" /></label>
                <label>Contact number<input name="phone" value={form.phone} onChange={change} required placeholder="+92 300 0000000" /></label>
                <label className="span-two">Address<input name="address" value={form.address} onChange={change} required placeholder="Street, area and city" /></label>
                {role === 'farmer' && (
                  <label className="span-two live-location-field">
                    Market live location
                    <input name="liveLocation" value={form.liveLocation} onChange={change} placeholder="Exact market pin or coordinates for better nearby results" />
                    <button className="btn btn--outline" type="button" onClick={useLiveLocation}><LocateFixed /> Use live location</button>
                  </label>
                )}
                <label className="span-two">Password<input name="password" type="password" minLength="6" value={form.password} onChange={change} required placeholder="At least 6 characters" /></label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <label className="check-label"><input type="checkbox" required /> I agree to the community guidelines and pickup-only policy.</label>
              <button className="btn btn--large" disabled={loading}>{loading ? 'Creating your account...' : 'Create my account'} <ArrowRight /></button>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
