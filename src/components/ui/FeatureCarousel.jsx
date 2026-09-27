import { ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { cx } from '../../utils/helpers'

const AUTOPLAY_MS = 3200

export default function FeatureCarousel({ slides = [] }) {
  const usableSlides = useMemo(() => slides.filter((slide) => slide?.image), [slides])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || usableSlides.length < 2) return undefined
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % usableSlides.length), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [paused, usableSlides.length])

  if (!usableSlides.length) return null

  const statusFor = (slideIndex) => {
    const diff = (slideIndex - index + usableSlides.length) % usableSlides.length
    if (diff === 0) return 'active'
    if (diff === 1) return 'next'
    if (diff === usableSlides.length - 1) return 'prev'
    return 'hidden'
  }

  return (
    <section className="feature-carousel" aria-label="Live MarketLink highlights" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="feature-carousel__stage">
        {usableSlides.map((slide, slideIndex) => (
          <article key={slide.id || slide.title} className={cx('feature-card', `feature-card--${statusFor(slideIndex)}`)} aria-hidden={statusFor(slideIndex) === 'hidden'}>
            <img src={slide.image} alt={slide.title} />
            <div>
              <span>{String(slideIndex + 1).padStart(2, '0')} / {usableSlides.length}</span>
              <h3>{slide.title}</h3>
              <p>{slide.description}</p>
              {slide.href && <Link to={slide.href}>View fresh pick <ArrowRight /></Link>}
            </div>
          </article>
        ))}
      </div>
      <div className="feature-carousel__dots">
        {usableSlides.map((slide, slideIndex) => <button key={slide.id || slide.title} className={slideIndex === index ? 'is-active' : ''} onClick={() => setIndex(slideIndex)} aria-label={`Show ${slide.title}`} />)}
      </div>
    </section>
  )
}
