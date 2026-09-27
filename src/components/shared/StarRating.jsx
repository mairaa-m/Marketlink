import { Star } from 'lucide-react'

export default function StarRating({ value = 0, onChange, size = 16, label = true }) {
  return (
    <span className="stars" aria-label={`${value} out of 5 stars`}>
      <span className="stars-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" disabled={!onChange} onClick={() => onChange?.(star)} aria-label={`Rate ${star} stars`}>
            <Star width={size} height={size} className={star <= Math.round(value) ? 'is-filled' : ''} />
          </button>
        ))}
      </span>
      {label && <b>{Number(value).toFixed(1)}</b>}
    </span>
  )
}
