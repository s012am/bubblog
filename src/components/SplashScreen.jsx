import { useState, useEffect } from 'react'

const BUBBLES = [
  {
    id: 'large',
    delay: 0.1,
    circle: { cx: 8, cy: 15, r: 5, strokeWidth: 0.8 },
    shine: { cx: 5.9, cy: 12.9, rx: 1.6, ry: 0.9, transform: 'rotate(-30 5.9 12.9)' },
  },
  {
    id: 'medium',
    delay: 0.28,
    circle: { cx: 18, cy: 7, r: 3, strokeWidth: 0.72 },
    shine: { cx: 16.9, cy: 5.9, rx: 0.9, ry: 0.5, transform: 'rotate(-30 16.9 5.9)' },
  },
  {
    id: 'small',
    delay: 0.44,
    circle: { cx: 19.5, cy: 17.5, r: 1.8, strokeWidth: 0.66 },
    shine: { cx: 18.8, cy: 16.8, rx: 0.55, ry: 0.32, transform: 'rotate(-30 18.8 16.8)' },
  },
]

export default function SplashScreen({ onDone }) {
  const [out, setOut] = useState(false)
  const themeId = localStorage.getItem('bubblog_theme') || 'default'
  const isDark = themeId === 'dark'

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 1200)
    const t2 = setTimeout(() => onDone(), 1650)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const bg = isDark ? '#1c1c1e' : 'white'

  const themeColors = {
    rose: '#e89ec4',
    warm: '#f2b882',
    sage: '#6ec48a',
    cool: '#818cf8',
  }
  const color = isDark ? '#f3f4f6' : (themeColors[themeId] ?? '#1f2937')

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-2 -translate-y-16"
      style={{
        background: bg,
        opacity: out ? 0 : 1,
        transition: out ? 'opacity 0.45s ease' : 'none',
      }}
    >
      <svg width="120" height="120" viewBox="0 0 24 24" fill="none" overflow="visible">
        {BUBBLES.map(({ id, delay, circle, shine }) => (
          <g key={id} style={{
            transformBox: 'fill-box',
            transformOrigin: `${circle.cx}px ${circle.cy}px`,
            animation: `bubble-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s both`,
          }}>
            <circle
              cx={circle.cx} cy={circle.cy} r={circle.r}
              stroke={color} strokeWidth={circle.strokeWidth}
            />
            <ellipse
              cx={shine.cx} cy={shine.cy}
              rx={shine.rx} ry={shine.ry}
              fill={color} opacity="0.2"
              transform={shine.transform}
            />
          </g>
        ))}
      </svg>

      <span style={{
        fontFamily: "'Fraunces', serif",
        fontWeight: 600,
        fontSize: '28px',
        letterSpacing: '-0.02em',
        color,
        lineHeight: 1,
        animation: 'splash-text-in 0.3s ease 0.6s both',
      }}>
        Bubblog
      </span>

      <style>{`
        @keyframes bubble-pop {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splash-text-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
