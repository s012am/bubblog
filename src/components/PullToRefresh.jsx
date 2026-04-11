import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 72

function getScrollableParent(el) {
  while (el && el !== document.body) {
    const { overflowY } = window.getComputedStyle(el)
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
      return el
    }
    el = el.parentElement
  }
  return null
}

export default function PullToRefresh() {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [clipY, setClipY] = useState(24)
  const startY = useRef(0)
  const pulling = useRef(false)

  useEffect(() => {
    if (!refreshing) return
    const start = performance.now()
    const duration = 400
    const raf = (time) => {
      const t = Math.min((time - start) / duration, 1)
      setClipY(24 * (1 - t))
      if (t < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [refreshing])

  useEffect(() => {
    const onTouchStart = (e) => {
      if (e.target.closest('[data-no-ptr]')) return
      // window 또는 스크롤 가능한 부모 요소가 맨 위일 때만 활성화
      const scrollable = getScrollableParent(e.target)
      const scrollTop = scrollable ? scrollable.scrollTop : window.scrollY
      if (scrollTop > 0) return
      startY.current = e.touches[0].clientY
      pulling.current = true
    }

    const onTouchMove = (e) => {
      if (!pulling.current) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) { setPullY(0); return }
      const y = Math.min(dy * 0.45, THRESHOLD + 16)
      setPullY(y)
    }

    const onTouchEnd = () => {
      if (!pulling.current) return
      pulling.current = false
      if (pullY >= THRESHOLD) {
        setRefreshing(true)
        setTimeout(() => window.location.reload(), 700)
      } else {
        setPullY(0)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [pullY])

  if (pullY === 0 && !refreshing) return null


  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center z-[100] pointer-events-none"
      style={{
        transform: `translateY(${pullY - 52}px)`,
        transition: refreshing ? 'transform 0.2s ease' : 'none',
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center"
        style={{
          background: 'var(--nav-bg)',
          boxShadow: '0 2px 14px rgba(0,0,0,0.2)',
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          style={refreshing ? { animation: 'ptr-bounce 0.45s ease infinite alternate' } : {}}
        >
          <defs>
            <clipPath id="ptr-clip">
              <rect x="0" y={clipY} width="24" height={24 - clipY} />
            </clipPath>
          </defs>

          {/* 연한 회색 테두리 (베이스) */}
          <circle cx="8" cy="15" r="5" stroke="#e5e7eb" strokeWidth="1.3" />
          <circle cx="18" cy="7" r="3" stroke="#e5e7eb" strokeWidth="1.2" />
          <circle cx="19.5" cy="17.5" r="1.8" stroke="#e5e7eb" strokeWidth="1.1" />

          {/* 진회색 테두리 — 아래에서 위로 클립 */}
          <g clipPath="url(#ptr-clip)">
            <circle cx="8" cy="15" r="5" stroke="#374151" strokeWidth="1.3" />
            <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="#374151" opacity="0.25" transform="rotate(-30 5.9 12.9)" />
            <circle cx="18" cy="7" r="3" stroke="#374151" strokeWidth="1.2" />
            <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="#374151" opacity="0.25" transform="rotate(-30 16.9 5.9)" />
            <circle cx="19.5" cy="17.5" r="1.8" stroke="#374151" strokeWidth="1.1" />
            <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="#374151" opacity="0.25" transform="rotate(-30 18.8 16.8)" />
          </g>
        </svg>
      </div>

      <style>{`
        @keyframes ptr-bounce {
          from { transform: scale(1); }
          to   { transform: scale(1.18); }
        }
      `}</style>
    </div>
  )
}
