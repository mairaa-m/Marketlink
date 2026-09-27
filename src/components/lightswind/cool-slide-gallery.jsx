import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function CoolSlideGallery({
  slides = [],
  cardWidth = 360,
  cardHeight = 420,
  showTitle = true,
  showArrows = true,
  showDots = true,
  draggable = true,
  autoplay = true,
  interval = 3600,
  onSlideChange,
}) {
  const [active, setActive] = useState(0)
  const dragStart = useRef(null)
  const slidesRef = useRef(slides)
  const total = slides.length
  const activeSlide = slides[active]

  const style = useMemo(() => ({
    '--gallery-card-width': `${cardWidth}px`,
    '--gallery-card-height': `${cardHeight}px`,
  }), [cardHeight, cardWidth])

  const goTo = useCallback((index) => {
    if (!total) return
    const next = (index + total) % total
    setActive(next)
    onSlideChange?.(next, slides[next])
  }, [onSlideChange, slides, total])

  useEffect(() => {
    slidesRef.current = slides
  }, [slides])

  useEffect(() => {
    if (!autoplay || total < 2) return undefined
    const timer = window.setInterval(() => {
      setActive((current) => {
        const next = (current + 1) % total
        onSlideChange?.(next, slidesRef.current[next])
        return next
      })
    }, interval)
    return () => window.clearInterval(timer)
  }, [autoplay, interval, onSlideChange, total])

  const startDrag = (event) => {
    if (!draggable) return
    dragStart.current = event.clientX ?? event.touches?.[0]?.clientX
  }

  const endDrag = (event) => {
    if (!draggable || dragStart.current == null) return
    const end = event.clientX ?? event.changedTouches?.[0]?.clientX
    const delta = end - dragStart.current
    dragStart.current = null
    if (Math.abs(delta) < 40) return
    goTo(active + (delta < 0 ? 1 : -1))
  }

  if (!activeSlide) return null

  return (
    <div className="cool-slide-gallery" style={style}>
      <div className="cool-slide-stage" onPointerDown={startDrag} onPointerUp={endDrag}>
        {slides.map((slide, index) => {
          const offset = (index - active + total) % total
          const position = offset === total - 1 ? -1 : offset
          return (
            <article className="cool-slide-card" data-position={position} key={slide.title}>
              {slide.items ? (
                <div className="cool-ticker-content">
                  <div className="cool-ticker-head"><span>{slide.badge}</span>{showTitle && <h2>{slide.title}</h2>}<p>{slide.subtitle}</p></div>
                  <div className="cool-ticker-list">
                    {slide.items.map((item, itemIndex) => (
                      <Link to={item.href} className={itemIndex === 1 ? 'cool-ticker-row is-featured' : 'cool-ticker-row'} key={`${slide.title}-${item.name}`}>
                        <span className="cool-ticker-icon">{item.icon}</span>
                        <div><b>{item.name}</b><small>{item.detail}</small></div>
                        <strong>{item.value}</strong>
                        <em>{item.meta}</em>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <img src={slide.src} alt={slide.title} draggable="false" />
                  <div className="cool-slide-shade" />
                  <div className="cool-slide-content">
                    <span>{slide.badge}</span>
                    {showTitle && <h2>{slide.title}</h2>}
                    <p>{slide.subtitle}</p>
                    {slide.meta && <strong>{slide.meta}</strong>}
                  </div>
                </>
              )}
            </article>
          )
        })}
      </div>
      {showArrows && total > 1 && <div className="cool-slide-arrows"><button type="button" onClick={() => goTo(active - 1)} aria-label="Previous highlight"><ChevronLeft /></button><button type="button" onClick={() => goTo(active + 1)} aria-label="Next highlight"><ChevronRight /></button></div>}
      {showDots && total > 1 && <div className="cool-slide-dots">{slides.map((slide, index) => <button type="button" key={slide.title} className={index === active ? 'is-active' : ''} onClick={() => goTo(index)} aria-label={`Show ${slide.title}`} />)}</div>}
    </div>
  )
}
