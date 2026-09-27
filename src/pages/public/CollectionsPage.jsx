import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import api from '../../api'
import ProductCard from '../../components/shared/ProductCard'
import Reveal from '../../components/shared/Reveal'
import useDebounce from '../../hooks/useDebounce'
import { getAvailability } from '../../utils/helpers'

const stockModes = [
  ['all', 'All stock'],
  ['daily', 'Daily fresh'],
  ['weekly', 'Weekly stock'],
  ['recent', 'Recently added'],
]

const sortOptions = [
  ['recommended', 'Recommended'],
  ['freshest', 'Freshest'],
  ['price-low', 'Price low to high'],
  ['price-high', 'Price high to low'],
  ['rating', 'Highest rated'],
  ['stock', 'Most stock'],
]

export default function CollectionsPage() {
  const db = api.snapshot()
  const [search, setSearch] = useState('')
  const [stockMode, setStockMode] = useState('all')
  const [category, setCategory] = useState('All')
  const [subcategory, setSubcategory] = useState('All')
  const [market, setMarket] = useState('All')
  const [farmerId, setFarmerId] = useState('All')
  const [availability, setAvailability] = useState('All')
  const [sort, setSort] = useState('recommended')
  const [showFilters, setShowFilters] = useState(false)
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(1000)
  const [minRating, setMinRating] = useState(0)
  const [unit, setUnit] = useState('All')
  const [maxDistance, setMaxDistance] = useState(10)
  const [recentOnly, setRecentOnly] = useState(false)
  const [freshTodayOnly, setFreshTodayOnly] = useState(false)
  const [freshWindowOnly, setFreshWindowOnly] = useState(false)
  const [seasonalOnly, setSeasonalOnly] = useState(false)
  const [popularOnly, setPopularOnly] = useState(false)
  const [restockedOnly, setRestockedOnly] = useState(false)
  const query = useDebounce(search)

  const categories = ['All', ...new Set(db.products.map((product) => product.category))]
  const subcategories = ['All', ...new Set(db.products.filter((product) => category === 'All' || product.category === category).map((product) => product.subcategory).filter(Boolean))]
  const units = ['All', ...new Set(db.products.map((product) => product.unit).filter(Boolean))]

  const results = useMemo(() => {
    const filtered = db.products.filter((product) => {
      const farmer = db.farmers.find((item) => item.id === product.farmerId)
      const av = getAvailability(product)
      if (query && !`${product.name} ${farmer?.name} ${product.category} ${product.subcategory || ''}`.toLowerCase().includes(query.toLowerCase())) return false
      if (category !== 'All' && product.category !== category) return false
      if (subcategory !== 'All' && product.subcategory !== subcategory) return false
      if (market !== 'All' && !product.marketIds.includes(market)) return false
      if (farmerId !== 'All' && product.farmerId !== farmerId) return false
      if (availability !== 'All' && (availability === 'available' ? !product.available || product.stock <= 0 : av.key !== availability)) return false
      if (product.price < minPrice || product.price > maxPrice) return false
      if (minRating > 0 && product.rating < minRating) return false
      if (unit !== 'All' && product.unit !== unit) return false
      if (product.distanceKm != null && product.distanceKm > maxDistance) return false
      if (recentOnly && !product.recentlyRestocked && (product.lastUpdatedMinutesAgo ?? 9999) > 90) return false
      if (freshTodayOnly && !product.freshToday && !product.stockedThisMorning) return false
      if (freshWindowOnly && !product.freshWindow) return false
      if (seasonalOnly && !product.seasonal) return false
      if (popularOnly && !product.popular) return false
      if (restockedOnly && !product.recentlyRestocked) return false
      if (stockMode === 'daily' && !product.freshToday && !product.stockedThisMorning) return false
      if (stockMode === 'weekly' && (product.freshToday || product.stockedThisMorning)) return false
      if (stockMode === 'recent' && !product.recentlyRestocked && (product.lastUpdatedMinutesAgo ?? 9999) > 90) return false
      return true
    })
    return [...filtered].sort((a, b) => {
      if (sort === 'freshest') return (a.harvestDaysAgo ?? 999) - (b.harvestDaysAgo ?? 999) || (a.lastUpdatedMinutesAgo ?? 9999) - (b.lastUpdatedMinutesAgo ?? 9999)
      if (sort === 'price-low') return a.price - b.price
      if (sort === 'price-high') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      if (sort === 'stock') return b.stock - a.stock
      return Number(b.available) - Number(a.available) || Number(b.recentlyRestocked) - Number(a.recentlyRestocked) || b.rating - a.rating
    })
  }, [query, category, subcategory, market, farmerId, availability, minPrice, maxPrice, minRating, unit, maxDistance, recentOnly, freshTodayOnly, freshWindowOnly, seasonalOnly, popularOnly, restockedOnly, stockMode, sort, db])

  const reset = () => {
    setSearch('')
    setStockMode('all')
    setCategory('All')
    setSubcategory('All')
    setMarket('All')
    setFarmerId('All')
    setAvailability('All')
    setSort('recommended')
    setMinPrice(0)
    setMaxPrice(1000)
    setMinRating(0)
    setUnit('All')
    setMaxDistance(10)
    setRecentOnly(false)
    setFreshTodayOnly(false)
    setFreshWindowOnly(false)
    setSeasonalOnly(false)
    setPopularOnly(false)
    setRestockedOnly(false)
  }

  return (
    <main>
      <section className="page-hero collections-hero">
        <div className="shell">
          <p className="eyebrow eyebrow--gold">FULL STOCK COLLECTIONS</p>
          <h1>All market <em>stock</em>, filtered.</h1>
          <p>Search every product listing across daily fresh arrivals, weekly stock, markets, categories and availability.</p>
          <div className="hero-filter-anchor">
            <div className="products-hero-search products-hero-search--collections">
              <label><Search /><input aria-label="Search all stock" value={search} onFocus={() => setShowFilters(false)} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, farmers, categories..." />{search && <button aria-label="Clear search" onClick={() => setSearch('')}><X /></button>}</label>
              <button className="filter-trigger-btn" type="button" onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}><SlidersHorizontal /> Filters</button>
              <label className="hero-select">Market<select value={market} onChange={(event) => setMarket(event.target.value)}><option value="All">All markets</option>{db.markets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
              <label className="hero-select">Sort<select value={sort} onChange={(event) => setSort(event.target.value)}>{sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            {showFilters && (
              <div className="filter-backdrop filter-backdrop--hero" onClick={() => setShowFilters(false)}>
                <div className="advanced-filters" role="region" aria-label="Collection filters" onClick={(event) => event.stopPropagation()}>
                <button className="text-btn filter-close" onClick={() => setShowFilters(false)}>Done / Close filters</button>
                <label>Stock type<select value={stockMode} onChange={(event) => setStockMode(event.target.value)}>{stockModes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Category<select value={category} onChange={(event) => { setCategory(event.target.value); setSubcategory('All') }}>{categories.map((item) => <option key={item} value={item}>{item === 'Fruit' ? 'Fruits' : item}</option>)}</select></label>
                <label>Subcategory<select value={subcategory} onChange={(event) => setSubcategory(event.target.value)}>{subcategories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label>Farmer<select value={farmerId} onChange={(event) => setFarmerId(event.target.value)}><option value="All">All farmers</option>{db.farmers.filter((farmer) => farmer.status === 'approved').map((farmer) => <option key={farmer.id} value={farmer.id}>{farmer.name}</option>)}</select></label>
                <label>Availability<select value={availability} onChange={(event) => setAvailability(event.target.value)}><option value="All">Any availability</option><option value="available">In stock</option><option value="limited">Limited stock</option><option value="almost-gone">Almost sold out</option><option value="restocked">Recently restocked</option><option value="sold-out">Sold out</option></select></label>
                <label>Min rating<select value={minRating} onChange={(event) => setMinRating(Number(event.target.value))}><option value={0}>Any rating</option><option value={4}>4+ stars</option><option value={4.5}>4.5+ stars</option><option value={4.8}>4.8+ stars</option></select></label>
                <label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value)}>{units.map((value) => <option key={value} value={value}>{value === 'All' ? 'All units' : value}</option>)}</select></label>
                <label>Min price (Rs)<input type="number" min="0" max={maxPrice} value={minPrice} onChange={(event) => setMinPrice(Math.min(maxPrice, Math.max(0, Number(event.target.value))))} /></label>
                <label>Max price: Rs {maxPrice}<input type="range" min="50" max="1000" step="10" value={maxPrice} onChange={(event) => setMaxPrice(Math.max(minPrice, Number(event.target.value)))} /></label>
                <label>Max distance: {maxDistance} km<input type="range" min="1" max="10" step="0.5" value={maxDistance} onChange={(event) => setMaxDistance(Number(event.target.value))} /></label>
                <div className="advanced-toggles">
                  <label className="toggle-pill"><input type="checkbox" checked={recentOnly} onChange={(event) => setRecentOnly(event.target.checked)} /> New / recent stock</label>
                  <label className="toggle-pill"><input type="checkbox" checked={freshTodayOnly} onChange={(event) => setFreshTodayOnly(event.target.checked)} /> Fresh today</label>
                  <label className="toggle-pill"><input type="checkbox" checked={freshWindowOnly} onChange={(event) => setFreshWindowOnly(event.target.checked)} /> Morning stock, expires within 24h</label>
                  <label className="toggle-pill"><input type="checkbox" checked={seasonalOnly} onChange={(event) => setSeasonalOnly(event.target.checked)} /> Seasonal</label>
                  <label className="toggle-pill"><input type="checkbox" checked={popularOnly} onChange={(event) => setPopularOnly(event.target.checked)} /> Popular</label>
                  <label className="toggle-pill"><input type="checkbox" checked={restockedOnly} onChange={(event) => setRestockedOnly(event.target.checked)} /> Recently Restocked</label>
                </div>
                <button className="text-btn" type="button" onClick={reset}>Reset all filters</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="shell collections-stock-browser">
          <div className="results-line"><span>{results.length} products found</span><span>{stockMode === 'daily' ? 'Daily stock means harvested or stocked this morning' : stockMode === 'weekly' ? 'Weekly stock includes stable listings not marked daily fresh' : 'Showing all matching inventory'}</span></div>

          {results.length ? <div className="product-grid">{results.map((product, index) => <Reveal key={product.id} delay={(index % 3) * 70}><ProductCard product={product} farmer={db.farmers.find((item) => item.id === product.farmerId)} /></Reveal>)}</div> : <div className="empty-state"><Search /><h2>No stock found</h2><p>Try another search, category, stock type, or market.</p><button className="btn btn--outline" onClick={reset}>Clear filters</button></div>}
        </div>
      </section>
    </main>
  )
}
