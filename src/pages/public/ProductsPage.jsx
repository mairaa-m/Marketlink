import { LocateFixed, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../api'
import ProductCard from '../../components/shared/ProductCard'
import Reveal from '../../components/shared/Reveal'
import { useAuth } from '../../context/AuthContext'
import useDebounce from '../../hooks/useDebounce'
import { getAvailability } from '../../utils/helpers'

const sortOptions = [
  ['recommended', 'Recommended'],
  ['price-low', 'Price: Low → High'],
  ['price-high', 'Price: High → Low'],
  ['nearest', 'Nearest'],
  ['rating', 'Highest Rated'],
  ['freshest', 'Freshest'],
  ['popular', 'Popular'],
]

const areaKeywords = {
  dha: ['dha', 'phase 5', 'defence'],
  gulberg: ['gulberg', 'liberty'],
  'model town': ['model town'],
}

function areaFromText(text = '') {
  const value = text.toLowerCase()
  return Object.entries(areaKeywords).find(([, keywords]) => keywords.some((keyword) => value.includes(keyword)))?.[0] || ''
}

export default function ProductsPage() {
  const db = api.snapshot()
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [location, setLocation] = useState(params.get('near') || user?.address || '')
  const [category, setCategory] = useState(params.get('category') || 'All')
  const [subcategory, setSubcategory] = useState(params.get('subcategory') || 'All')
  const [market, setMarket] = useState(params.get('market') || 'All')
  const [farmerId, setFarmerId] = useState(params.get('farmer') || 'All')
  const [availability, setAvailability] = useState('All')
  const [minRating, setMinRating] = useState(0)
  const [maxDistance, setMaxDistance] = useState(10)
  const [minPrice, setMinPrice] = useState(0)
  const [unit, setUnit] = useState('All')
  const [maxPrice, setMaxPrice] = useState(1000)
  const [freshToday, setFreshToday] = useState(params.get('freshToday') === '1')
  const [seasonal, setSeasonal] = useState(params.get('seasonal') === '1')
  const [popularOnly, setPopularOnly] = useState(params.get('popular') === '1')
  const [restockedOnly, setRestockedOnly] = useState(params.get('restocked') === '1')
  const [recentStockOnly, setRecentStockOnly] = useState(params.get('recent') !== '0')
  const [freshWindowOnly, setFreshWindowOnly] = useState(params.get('freshWindow') === '1')
  const [showMore, setShowMore] = useState(false)
  const filterPanel = useRef(null)
  useEffect(() => {
    if (!showMore) return
    const previous = document.activeElement
    const mobile = window.matchMedia('(max-width: 640px)').matches
    const oldOverflow = document.body.style.overflow
    if (mobile) document.body.style.overflow = 'hidden'
    filterPanel.current?.querySelector('button')?.focus()
    return () => { document.body.style.overflow = oldOverflow; previous?.focus() }
  }, [showMore])
  const [sort, setSort] = useState('recommended')
  const query = useDebounce(search)
  const nearQuery = useDebounce(location)

  const categories = ['All', ...new Set(db.products.map((item) => item.category))]
  const subcategories = ['All', ...new Set(db.products.filter((item) => category === 'All' || item.category === category).map((item) => item.subcategory).filter(Boolean))]
  const preferredArea = areaFromText(nearQuery)
  const nearbyMarketIds = useMemo(() => preferredArea ? db.markets.filter((item) => areaFromText(`${item.name} ${item.address}`) === preferredArea).map((item) => item.id) : [], [db.markets, preferredArea])

  const results = useMemo(() => {
    const filtered = db.products.filter((product) => {
      const farmer = db.farmers.find((item) => item.id === product.farmerId)
      const av = getAvailability(product)
      if (query && !`${product.name} ${farmer?.name}`.toLowerCase().includes(query.toLowerCase())) return false
      if (nearbyMarketIds.length && !product.marketIds.some((id) => nearbyMarketIds.includes(id))) return false
      if (category !== 'All' && product.category !== category) return false
      if (subcategory !== 'All' && product.subcategory !== subcategory) return false
      if (market !== 'All' && !product.marketIds.includes(market)) return false
      if (farmerId !== 'All' && product.farmerId !== farmerId) return false
      if (availability !== 'All' && (availability === 'available' ? !product.available || product.stock <= 0 : av.key !== availability)) return false
      if (minRating > 0 && product.rating < minRating) return false
      if (product.distanceKm != null && product.distanceKm > maxDistance) return false
      if (unit !== 'All' && product.unit !== unit) return false
      if (product.price < minPrice || product.price > maxPrice) return false
      if (recentStockOnly && !product.recentlyRestocked && (product.lastUpdatedMinutesAgo ?? 9999) > 90) return false
      if (freshToday && !product.freshToday) return false
      if (freshWindowOnly && !product.freshWindow) return false
      if (seasonal && !product.seasonal) return false
      if (popularOnly && !product.popular) return false
      if (restockedOnly && !product.recentlyRestocked) return false
      return true
    })
    const sorted = [...filtered].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'price-high') return b.price - a.price
      if (sort === 'nearest') return (a.distanceKm ?? 99) - (b.distanceKm ?? 99)
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'freshest') return (a.freshToday ? 0 : a.harvestDaysAgo ?? 999) - (b.freshToday ? 0 : b.harvestDaysAgo ?? 999)
      if (sort === 'popular') return Number(b.popular) - Number(a.popular) || b.reviews - a.reviews
      return (a.lastUpdatedMinutesAgo ?? 9999) - (b.lastUpdatedMinutesAgo ?? 9999) || Number(b.recentlyRestocked) - Number(a.recentlyRestocked) || Number(b.available) - Number(a.available) || b.rating - a.rating
    })
    return sorted
  }, [query, nearbyMarketIds, category, subcategory, market, farmerId, availability, minRating, maxDistance, minPrice, unit, maxPrice, recentStockOnly, freshToday, freshWindowOnly, seasonal, popularOnly, restockedOnly, sort, db])

  const resetFilters = () => {
    setSearch(''); setCategory('All'); setSubcategory('All'); setMarket('All'); setFarmerId('All')
    setMinPrice(0); setUnit('All'); setAvailability('All'); setMinRating(0); setMaxDistance(10); setMaxPrice(1000)
    setLocation(user?.address || ''); setRecentStockOnly(true); setFreshToday(false); setFreshWindowOnly(false); setSeasonal(false); setPopularOnly(false); setRestockedOnly(false); setSort('recommended')
    setParams({})
  }

  const chips = [
    [search && 'Search: ' + search, () => setSearch('')],
    [category !== 'All' && category, () => { setCategory('All'); setSubcategory('All') }],
    [subcategory !== 'All' && subcategory, () => setSubcategory('All')],
    [market !== 'All' && db.markets.find((item) => item.id === market)?.name, () => setMarket('All')],
    [farmerId !== 'All' && db.farmers.find((item) => item.id === farmerId)?.name, () => setFarmerId('All')],
    [availability !== 'All' && availability, () => setAvailability('All')],
    [minPrice > 0 && 'Min Rs ' + minPrice, () => setMinPrice(0)],
    [maxPrice < 1000 && 'Max Rs ' + maxPrice, () => setMaxPrice(1000)],
    [minRating > 0 && minRating + '+ stars', () => setMinRating(0)],
    [maxDistance < 10 && maxDistance + ' km', () => setMaxDistance(10)],
    [unit !== 'All' && unit, () => setUnit('All')],
    [location && 'Near: ' + location, () => setLocation('')],
    [recentStockOnly && 'Recent seller stock', () => setRecentStockOnly(false)],
    [freshWindowOnly && 'Morning stock under 24h', () => setFreshWindowOnly(false)],
    [freshToday && 'Fresh Today', () => setFreshToday(false)], [seasonal && 'Seasonal', () => setSeasonal(false)],
    [popularOnly && 'Popular', () => setPopularOnly(false)], [restockedOnly && 'Recently Restocked', () => setRestockedOnly(false)],
  ].filter(([label]) => label)
  const useBrowserLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(({ coords }) => setLocation(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`))
  }

  return <main><section className="page-hero products-hero"><div className="shell"><p className="eyebrow eyebrow--gold">FRESH PRODUCE & NATURAL PROVISIONS</p><h1>Recently added <em>seller stock.</em></h1><p>Fresh Produce shows products farmers recently added, restocked, or updated. Use Collections for the full daily and weekly catalog.</p><div className="hero-filter-anchor"><div className="products-hero-search products-hero-search--full"><label><MapPin /><input aria-label="Search location" value={location} onFocus={() => setShowMore(false)} onChange={(event) => setLocation(event.target.value)} placeholder="Area, city, or live coordinates" /></label><label><Search /><input aria-label="Search produce" value={search} onFocus={() => setShowMore(false)} onChange={(event) => setSearch(event.target.value)} placeholder="Tomatoes, spinach, honey..." /></label><button className="filter-trigger-btn" type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore}><SlidersHorizontal /> Filters</button><label className="hero-select">Market<select value={market} onChange={(event) => setMarket(event.target.value)}><option value="All">All markets</option>{db.markets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label className="hero-select">Sort<select value={sort} onChange={(event) => setSort(event.target.value)}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="btn" type="button" onClick={useBrowserLocation}><LocateFixed /> Live</button></div>{showMore && (
          <div className="filter-backdrop filter-backdrop--hero" onClick={() => setShowMore(false)}><div className="advanced-filters" ref={filterPanel} role="region" aria-label="Product filters" onKeyDown={(event) => { if (event.key === 'Escape') setShowMore(false) }} onClick={(event) => event.stopPropagation()}>
            <button className="text-btn filter-close" onClick={() => setShowMore(false)}>Done / Close filters</button>
            <label>Category<select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory('All') }}>{categories.map((item) => <option key={item} value={item}>{item === 'Fruit' ? 'Fruits' : item}</option>)}</select></label>
            <label>Subcategory<select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>{subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label>Farmer<select value={farmerId} onChange={(event) => setFarmerId(event.target.value)}><option value="All">All farmers</option>{db.farmers.filter((farmer) => farmer.status === 'approved').map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.name}</option>)}</select></label>
            <label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="All">Any availability</option><option value="available">In Stock</option><option value="limited">Limited Stock</option><option value="almost-gone">Almost Sold Out</option><option value="restocked">Recently Restocked</option><option value="sold-out">Sold Out</option></select></label>
            <label>Min rating<select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))}><option value={0}>Any rating</option><option value={4}>4+ stars</option><option value={4.5}>4.5+ stars</option><option value={4.8}>4.8+ stars</option></select></label>
            <label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value)}><option value="All">All units</option>{[...new Set(db.products.map((product) => product.unit))].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label>Min price (Rs)<input type="number" min="0" max={maxPrice} value={minPrice} onChange={(event) => setMinPrice(Math.min(maxPrice, Math.max(0, Number(event.target.value))))} /></label>
            <label>Max price: Rs {maxPrice}<input type="range" min="50" max="1000" step="10" value={maxPrice} onChange={(event) => setMaxPrice(Math.max(minPrice, Number(event.target.value)))} /></label>
            <label>Max distance: {maxDistance} km<input type="range" min="1" max="10" step="0.5" value={maxDistance} onChange={(event) => setMaxDistance(Number(event.target.value))} /></label>
            <div className="advanced-toggles">
              <label className="toggle-pill"><input type="checkbox" checked={recentStockOnly} onChange={(event) => setRecentStockOnly(event.target.checked)} /> Recent seller stock</label>
              <label className="toggle-pill"><input type="checkbox" checked={freshWindowOnly} onChange={(event) => setFreshWindowOnly(event.target.checked)} /> Morning stock, expires within 24h</label>
              <label className="toggle-pill"><input type="checkbox" checked={freshToday} onChange={(event) => setFreshToday(event.target.checked)} /> Fresh Today</label>
              <label className="toggle-pill"><input type="checkbox" checked={seasonal} onChange={(event) => setSeasonal(event.target.checked)} /> Seasonal</label>
              <label className="toggle-pill"><input type="checkbox" checked={popularOnly} onChange={(event) => setPopularOnly(event.target.checked)} /> Popular</label>
              <label className="toggle-pill"><input type="checkbox" checked={restockedOnly} onChange={(event) => setRestockedOnly(event.target.checked)} /> Recently Restocked</label>
            </div>
            <button className="text-btn" onClick={resetFilters} type="button">Reset all filters</button>
          </div></div>
        )}</div></div></section>
    <section className="section section--paper">
      <div className="shell">
        <div className="products-browser">
        <div className="products-results">
        <div className="filter-pills active-filter-chips">{chips.map(([label, clear]) => <button key={label} onClick={clear} aria-label={`Remove ${label} filter`}>{label} <X size={12} /></button>)}{chips.length > 0 && <button onClick={resetFilters}>Clear All</button>}</div>
        <div className="results-line"><span>{results.length} fresh produce results</span><span>{recentStockOnly ? 'Showing recent seller stock first' : 'Showing all matching stock'} · Stock changes as reservations arrive</span></div>
        {results.length ? <div className="product-grid">{results.map((product, index) => <Reveal key={product.id} delay={(index % 3) * 80}><ProductCard product={product} farmer={db.farmers.find((item) => item.id === product.farmerId)} /></Reveal>)}</div> : <div className="empty-state"><Search /><h2>No harvest found</h2><p>Try another category, market, or search term.</p><button className="btn btn--outline" onClick={resetFilters}>Clear Filters</button></div>}
        </div>
        </div>
      </div>
    </section>
  </main>
}
