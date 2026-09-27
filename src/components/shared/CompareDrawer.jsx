import { ArrowRight, Scale, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCompare } from '../../context/CompareContext'
import { formatCurrency } from '../../utils/helpers'

export default function CompareDrawer() {
  const { items, removeItem, clear } = useCompare()
  if (!items.length) return null
  return (
    <div className="compare-drawer" role="region" aria-label="Products you are comparing">
      <div className="compare-drawer-head">
        <span><Scale /> Comparing {items.length} {items.length === 1 ? 'item' : 'items'}</span>
        <button className="text-btn" onClick={clear}>Clear</button>
      </div>
      <div className="compare-drawer-items">
        {items.map((item) => (
          <div className="compare-chip" key={item.id}>
            <img src={item.image} alt={item.name} />
            <div><b>{item.name}</b><span>{formatCurrency(item.price)}/{item.unit}</span></div>
            <button aria-label={`Remove ${item.name} from comparison`} onClick={() => removeItem(item.id)}><X /></button>
          </div>
        ))}
      </div>
      <Link className="btn btn--harvest" to={`/compare/${items[0].id}`}>Compare now <ArrowRight /></Link>
    </div>
  )
}
