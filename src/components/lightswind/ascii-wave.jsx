import { useMemo } from 'react'

export default function AsciiWave({ color = '#f97316', speed = 1 }) {
  const rows = useMemo(() => {
    const glyphs = ['.', ':', '-', '=', '+', '*', '#', '%', '@']
    return Array.from({ length: 24 }, (_, row) => (
      Array.from({ length: 76 }, (_, col) => glyphs[(row * 3 + col * 2) % glyphs.length]).join('')
    ))
  }, [])

  return (
    <div className="ascii-wave" style={{ '--wave-color': color, '--wave-duration': `${18 / Math.max(.25, speed)}s` }} aria-hidden="true">
      <pre>{rows.join('\n')}</pre>
      <pre>{rows.slice().reverse().join('\n')}</pre>
    </div>
  )
}
