import { ArrowRight, Leaf, MapPin, Search, Sprout } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import StarRating from '../../components/shared/StarRating'

export default function FarmersPage() {
  const db = api.snapshot()
  const [search, setSearch] = useState('')
  const farmers = useMemo(() => db.farmers.filter((farmer) => `${farmer.name} ${farmer.owner} ${farmer.specialties}`.toLowerCase().includes(search.toLowerCase())), [search, db.farmers])
  return <main><section className="page-hero page-hero--farmers"><div className="shell"><p className="eyebrow eyebrow--gold">THE PEOPLE BEHIND THE PRODUCE</p><h1>Know your <em>grower.</em></h1><p>Meet the farmers, bakers and makers who update their own stock each week.</p></div></section><section className="section section--paper"><div className="shell"><label className="search-field search-field--wide"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by farmer, grower or specialty" /></label><div className="farmer-grid">{farmers.map((farmer) => { const product = db.products.find((item) => item.farmerId === farmer.id); const markets = db.markets.filter((item) => farmer.marketIds.includes(item.id)); return <article className="farmer-card" key={farmer.id}><div className="farmer-card-visual">{product ? <img src={product.image} alt="" /> : <Sprout />}<span>{farmer.initials}</span><small>EST. {2026 - farmer.years}</small></div><div className="farmer-card-body"><div><p>{farmer.owner}</p><h2>{farmer.name}</h2></div><StarRating value={farmer.rating} /><p>{farmer.bio}</p><div className="specialties">{farmer.specialties.map((item) => <span key={item}><Leaf />{item}</span>)}</div><div className="farmer-location"><MapPin /><span>{markets.map((item) => item.name).join(' · ')}</span></div><Link className="arrow-link" to={`/farmers/${farmer.id}`}>Visit farm profile <ArrowRight /></Link></div></article> })}</div></div></section></main>
}
