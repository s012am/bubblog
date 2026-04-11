import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useFollow } from '../context/FollowContext'

const RADII = [65, 58, 54, 62]

function formatRemaining(expiresAt) {
  const ms = expiresAt - Date.now()
  if (ms <= 0) return '만료'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}초`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간`
  return `${Math.floor(h / 24)}일`
}

function initBubbles(w, h, posts) {
  const bubbles = []
  for (let i = 0; i < posts.length; i++) {
    const r = RADII[i % RADII.length] ?? 58
    let x, y, tries = 0
    do {
      x = r + Math.random() * (w - r * 2)
      y = r + Math.random() * (h - r * 2)
      tries++
    } while (tries < 100 && bubbles.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + r + 10))
    bubbles.push({ id: posts[i].id, post: posts[i], r, x, y, vx: (Math.random() - 0.5) * 3.0, vy: (Math.random() - 0.5) * 3.0, mass: r })
  }
  return bubbles
}

function BubbleNode({ b, isDragging, isFlipped, onClick, onMouseDown, onTouchStart }) {
  const [hovered, setHovered] = useState(false)
  const isDark = document.documentElement.hasAttribute('data-dark')
  const showRebubble = b.post._rebubbledBy && !isFlipped
  const bgActive = isDark
    ? 'radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.07) 55%, rgba(255,255,255,0.02) 100%)'
    : 'radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.42) 55%, rgba(255,255,255,0.18) 100%)'
  const bgNormal = isDark
    ? 'radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.01) 100%)'
    : 'radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.32) 55%, rgba(255,255,255,0.12) 100%)'
  return (
    <div
      onClick={onClick}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      data-no-ptr
      className="absolute flex items-center justify-center text-center select-none"
      style={{
        width: b.r * 2, height: b.r * 2,
        left: b.x - b.r, top: b.y - b.r,
        borderRadius: '50%',
        cursor: isDragging ? 'grabbing' : 'grab',
        background: hovered || isDragging ? bgActive : bgNormal,
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: isDark ? '1.5px solid rgba(255,255,255,0.14)' : '1.5px solid rgba(255,255,255,0.6)',
        boxShadow: hovered || isDragging
          ? '0 8px 32px rgba(0,0,0,0.1), inset 0 -3px 8px rgba(0,0,0,0.04)'
          : '0 4px 20px rgba(0,0,0,0.07), inset 0 -3px 8px rgba(0,0,0,0.03)',
        transition: 'box-shadow 0.2s, background 0.2s',
        transform: isDragging ? 'scale(1.06)' : hovered ? 'scale(1.04)' : 'scale(1)',
        willChange: 'left, top',
        zIndex: isDragging ? 20 : hovered ? 10 : 1,
      }}
    >
      <div className="absolute pointer-events-none" style={{ width: '40%', height: '30%', top: '10%', left: '8%', borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.60)', filter: 'blur(5px)' }} />
      <div className="relative z-10 px-4 flex flex-col items-center gap-1">
        {showRebubble ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 34, height: 34, flexShrink: 0, color: '#9ca3af' }}>
              <circle cx="8" cy="15" r="5" strokeWidth="1.0" />
              <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
              <circle cx="18" cy="7" r="3" strokeWidth="0.9" />
              <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
              <circle cx="19.5" cy="17.5" r="1.8" strokeWidth="0.8" />
              <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="currentColor" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
            </svg>
            <p className="text-[10px] font-semibold text-gray-400">{b.post._rebubbledBy}</p>
          </>
        ) : (
          <>
            {b.post.expiresAt
              ? <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: '#9ca3af' }}>{formatRemaining(b.post.expiresAt)}</p>
              : <p className="text-3xl font-light leading-none" style={{ color: '#9ca3af' }}>∞</p>}
            <p className="text-xs font-bold text-gray-700 leading-snug line-clamp-3">{b.post.title}</p>
            <p className="text-[10px] text-gray-400">{b.post.author}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function FollowFeed() {
  const containerRef = useRef(null)
  const bubblesRef = useRef([])
  const rafRef = useRef(null)
  const lastRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dragRef = useRef(null)
  const didDragRef = useRef(false)
  const navigate = useNavigate()
  const { posts } = usePosts()
  const { following, followedProfiles, profilesLoaded } = useFollow()
  const [, setTick] = useState(0)
  const [, setIsDragging] = useState(false)
  const [flippedIds, setFlippedIds] = useState(new Set())

  const feedPosts = useMemo(() => {
    // Build userId → profile map for rebubble attribution
    const followedProfilesByUid = Object.fromEntries(
      Object.values(followedProfiles).filter(p => p.id).map(p => [p.id, p])
    )
    const seen = new Set()
    const result = []
    for (const p of posts) {
      if (seen.has(p.id)) continue
      const byFollowed = following.includes(p.authorUsername)
      const rebubbledFollower = (p.rebubbles || []).find(uid => followedProfilesByUid[uid])
      const rebubbledByFollowed = !!rebubbledFollower
      if (byFollowed || rebubbledByFollowed) {
        seen.add(p.id)
        const rebubbler = rebubbledByFollowed && !byFollowed ? followedProfilesByUid[rebubbledFollower] : null
        result.push({ ...p, _rebubbledBy: rebubbler ? (rebubbler.nickname || rebubbler.username) : null })
      }
    }
    return result.slice(0, 15)
  }, [posts, following, followedProfiles])

  const feedPostIdsRef = useRef('')

  // post ID가 바뀔 때만 버블 위치 초기화
  useEffect(() => {
    const newIds = feedPosts.map(p => p.id).join(',')
    if (newIds === feedPostIdsRef.current) return
    feedPostIdsRef.current = newIds
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth, h = el.clientHeight
    sizeRef.current = { w, h }
    bubblesRef.current = initBubbles(w, h, feedPosts)
  }, [feedPosts])

  // 애니메이션 루프는 한 번만 시작
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onResize = () => {
      const w = el.clientWidth, h = el.clientHeight
      sizeRef.current = { w, h }
    }
    window.addEventListener('resize', onResize)

    const DAMPING = 0.999, MAX_SPEED = 10.0, WANDER = 0.05
    const loop = (time) => {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 16, 3)
      lastRef.current = time
      const { w, h } = sizeRef.current
      const bs = bubblesRef.current
      const draggingId = dragRef.current?.id

      for (const b of bs) {
        if (b.id === draggingId) continue
        b.vx += (Math.random() - 0.5) * WANDER * dt
        b.vy += (Math.random() - 0.5) * WANDER * dt
        b.x += b.vx * dt; b.y += b.vy * dt
        b.vx *= DAMPING; b.vy *= DAMPING
        const spd = Math.hypot(b.vx, b.vy)
        if (spd > MAX_SPEED) { b.vx = (b.vx / spd) * MAX_SPEED; b.vy = (b.vy / spd) * MAX_SPEED }
        if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.7 }
        if (b.x + b.r > w) { b.x = w - b.r; b.vx = -Math.abs(b.vx) * 0.7 }
        if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.7 }
        if (b.y + b.r > h) { b.y = h - b.r; b.vy = -Math.abs(b.vy) * 0.7 }
      }

      for (let i = 0; i < bs.length; i++) {
        for (let j = i + 1; j < bs.length; j++) {
          const a = bs[i], b = bs[j]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.hypot(dx, dy)
          const minD = a.r + b.r + 2
          if (dist >= minD || dist < 0.001) continue
          const nx = dx / dist, ny = dy / dist
          const overlap = minD - dist
          const aFixed = a.id === draggingId, bFixed = b.id === draggingId
          const repulse = overlap * 0.5
          if (!aFixed) { a.vx -= nx * repulse; a.vy -= ny * repulse }
          if (!bFixed) { b.vx += nx * repulse; b.vy += ny * repulse }
          const dvx = a.vx - b.vx, dvy = a.vy - b.vy
          const dot = dvx * nx + dvy * ny
          if (dot > 0) {
            const boost = 1.4
            if (aFixed) { b.vx += boost * 2 * dot * nx; b.vy += boost * 2 * dot * ny }
            else if (bFixed) { a.vx -= boost * 2 * dot * nx; a.vy -= boost * 2 * dot * ny }
            else {
              const imp = (boost * 2 * dot) / (a.mass + b.mass)
              a.vx -= imp * b.mass * nx; a.vy -= imp * b.mass * ny
              b.vx += imp * a.mass * nx; b.vy += imp * a.mass * ny
            }
          }
          if (aFixed) { b.x += nx * overlap; b.y += ny * overlap }
          else if (bFixed) { a.x -= nx * overlap; a.y -= ny * overlap }
          else {
            const t = a.mass + b.mass
            a.x -= nx * overlap * (b.mass / t); a.y -= ny * overlap * (b.mass / t)
            b.x += nx * overlap * (a.mass / t); b.y += ny * overlap * (a.mass / t)
          }
        }
      }

      setTick((n) => n + 1)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener('resize', onResize) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onMouseDown = useCallback((e, bubbleId) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const b = bubblesRef.current.find((b) => b.id === bubbleId)
    if (!b) return
    const mx = e.clientX - rect.left, my = e.clientY - rect.top
    didDragRef.current = false
    dragRef.current = { id: bubbleId, offsetX: mx - b.x, offsetY: my - b.y, history: [{ x: mx, y: my, t: performance.now() }] }
    setIsDragging(true)
    const onMouseMove = (e) => {
      if (!dragRef.current) return
      didDragRef.current = true
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left, my = e.clientY - rect.top
      const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
      if (!b) return
      const now = performance.now()
      const prevX = b.x, prevY = b.y
      b.x = mx - dragRef.current.offsetX; b.y = my - dragRef.current.offsetY
      b.vx = (b.x - prevX) / Math.max(now - dragRef.current.history.at(-1).t, 1) * 16
      b.vy = (b.y - prevY) / Math.max(now - dragRef.current.history.at(-1).t, 1) * 16
      dragRef.current.history.push({ x: mx, y: my, t: now })
      dragRef.current.history = dragRef.current.history.filter((p) => now - p.t < 80)
    }
    const onMouseUp = () => {
      if (dragRef.current) {
        const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
        if (b) {
          const h = dragRef.current.history
          if (h.length >= 2) { const f = h[0], l = h[h.length - 1]; const dt = Math.max(l.t - f.t, 1); b.vx = ((l.x - f.x) / dt) * 16; b.vy = ((l.y - f.y) / dt) * 16 }
          else { b.vx = 0; b.vy = 0 }
        }
      }
      dragRef.current = null; setIsDragging(false)
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp)
  }, [])

  const onTouchStart = useCallback((e, bubbleId) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const touch = e.touches[0]
    const b = bubblesRef.current.find((b) => b.id === bubbleId)
    if (!b) return
    const mx = touch.clientX - rect.left, my = touch.clientY - rect.top
    dragRef.current = { id: bubbleId, offsetX: mx - b.x, offsetY: my - b.y, history: [{ x: mx, y: my, t: performance.now() }] }
    setIsDragging(true)
    const onTouchMove = (e) => {
      e.preventDefault()
      if (!dragRef.current) return
      const rect = el.getBoundingClientRect()
      const touch = e.touches[0]
      const mx = touch.clientX - rect.left, my = touch.clientY - rect.top
      const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
      if (!b) return
      b.x = mx - dragRef.current.offsetX; b.y = my - dragRef.current.offsetY
      const now = performance.now()
      dragRef.current.history.push({ x: mx, y: my, t: now })
      dragRef.current.history = dragRef.current.history.filter((p) => now - p.t < 80)
    }
    const onTouchEnd = () => {
      if (dragRef.current) {
        const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
        if (b) {
          const h = dragRef.current.history
          if (h.length >= 2) { const f = h[0], l = h[h.length - 1]; const dt = Math.max(l.t - f.t, 1); b.vx = ((l.x - f.x) / dt) * 16; b.vy = ((l.y - f.y) / dt) * 16 }
          else { b.vx = 0; b.vy = 0 }
        }
      }
      dragRef.current = null; setIsDragging(false)
      window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd)
    }
    window.addEventListener('touchmove', onTouchMove, { passive: false }); window.addEventListener('touchend', onTouchEnd)
  }, [])

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* 헤더 */}
      <div style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--divider)' }}>
        <div className="px-6 pt-4 pb-3">
          <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '18px' }}>Bubblog</h1>
        </div>

        {/* 팔로잉 유저 줄 */}
        {following.length > 0 && profilesLoaded && (
          <div className="flex gap-4 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {following.map((username) => {
              const p = followedProfiles[username]
              const displayName = p?.nickname || username
              return (
                <Link
                  key={username}
                  to={`/user/${username}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
                    style={{ background: 'var(--avatar-bg)', border: '2px solid var(--card-border)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  >
                    {p?.avatar_url
                      ? <img src={p.avatar_url} alt={displayName} className="w-full h-full object-cover rounded-full" />
                      : <span className="text-sm font-bold text-gray-400">{displayName[0].toUpperCase()}</span>
                    }
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 max-w-[48px] truncate">{displayName}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 버블 캔버스 */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {following.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-12 h-12 text-gray-200">
              <circle cx="8" cy="15" r="5" />
              <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.3} transform="rotate(-30 5.9 12.9)" />
              <circle cx="18" cy="7" r="3" />
              <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.3} transform="rotate(-30 16.9 5.9)" />
              <circle cx="19.5" cy="17.5" r="1.8" />
            </svg>
            <p className="text-sm text-gray-300 text-center leading-relaxed">
              Bubble을 탐색해 보세요.
            </p>
          </div>
        )}

        {following.length > 0 && feedPosts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-300 text-center leading-relaxed">
              Bubble을 탐색해 보세요.
            </p>
          </div>
        )}

        {bubblesRef.current.map((b) => (
          <BubbleNode
            key={b.id}
            b={b}
            isDragging={dragRef.current?.id === b.id}
            isFlipped={flippedIds.has(b.id)}
            onClick={() => {
              if (didDragRef.current) return
              if (b.post._rebubbledBy && !flippedIds.has(b.id)) {
                setFlippedIds((prev) => new Set([...prev, b.id]))
              } else {
                navigate(`/post/${b.id}`)
              }
            }}
            onMouseDown={(e) => onMouseDown(e, b.id)}
            onTouchStart={(e) => onTouchStart(e, b.id)}
          />
        ))}
      </div>
    </div>
  )
}
