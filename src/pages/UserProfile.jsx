import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useFollow } from '../context/FollowContext'
import { supabase } from '../lib/supabase'
import PostCard from '../components/PostCard'
import InfoSheet from '../components/InfoSheet'

const RADII = [65, 58, 54, 62]
const DELETE_ZONE_H = 0 // 다른 사람 글은 삭제 없음

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
    const r = RADII[i % RADII.length]
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

function BubbleNode({ b, isDragging, onClick, onMouseDown, onTouchStart }) {
  const [hovered, setHovered] = useState(false)
  const isDark = document.documentElement.hasAttribute('data-dark')
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
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
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
      <div className="relative z-10 px-4">
        {b.post.expiresAt
          ? <p className="text-[10px] font-medium mb-1 tracking-wide uppercase" style={{ color: '#9ca3af' }}>{formatRemaining(b.post.expiresAt)}</p>
          : <p className="text-3xl font-light mb-0.5 leading-none" style={{ color: '#9ca3af' }}>∞</p>}
        <p className="text-xs font-bold text-gray-700 leading-snug line-clamp-3">{b.post.title}</p>
      </div>
    </div>
  )
}


export default function UserProfile() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { posts: myPosts } = usePosts()
  const { isFollowing, follow, unfollow } = useFollow()

  const [user, setUser] = useState({ name, bio: '', avatar: null })

  useEffect(() => {
    supabase.from('profiles').select('username, nickname, bio, avatar_url').eq('username', name).single()
      .then(({ data, error }) => {
        console.log('[UserProfile] data:', data, 'error:', error)
        if (data) setUser({ name: data.username, nickname: data.nickname, bio: data.bio || '', avatar: data.avatar_url || null })
      })
  }, [name])

  const userPosts = useMemo(() => myPosts.filter((p) => p.authorUsername === name || p.author === name).slice(0, 15), [name, myPosts])

  const [activeTab, setActiveTab] = useState('drift')
  const [showList, setShowList] = useState(false)
  const [listTab, setListTab] = useState('all')
  const [infoOpen, setInfoOpen] = useState(false)

  const [tick, setTick] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const containerRef = useRef(null)
  const bubblesRef = useRef([])
  const rafRef = useRef(null)
  const lastRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dragRef = useRef(null)
  const didDragRef = useRef(false)

  const reset = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth, h = el.clientHeight
    sizeRef.current = { w, h }
    bubblesRef.current = initBubbles(w, h, userPosts)
  }, [userPosts])

  useEffect(() => {
    if (activeTab !== 'drift' || showList) return
    reset()
    const onResize = () => reset()
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
          const dist = Math.hypot(dx, dy), minD = a.r + b.r + 2
          if (dist >= minD || dist < 0.001) continue
          const nx = dx / dist, ny = dy / dist, overlap = minD - dist
          const aFixed = a.id === draggingId, bFixed = b.id === draggingId
          const repulse = overlap * 0.5
          if (!aFixed) { a.vx -= nx * repulse; a.vy -= ny * repulse }
          if (!bFixed) { b.vx += nx * repulse; b.vy += ny * repulse }
          const dvx = a.vx - b.vx, dvy = a.vy - b.vy, dot = dvx * nx + dvy * ny
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
  }, [reset, activeTab, showList])

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
      const last = dragRef.current.history[dragRef.current.history.length - 1]
      b.vx = (b.x - prevX) / Math.max(now - last.t, 1) * 16
      b.vy = (b.y - prevY) / Math.max(now - last.t, 1) * 16
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

  const followed = isFollowing(name)

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* 헤더 */}
      <div className="px-6 pt-4 pb-0" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)' }}>
        <div className="flex flex-col items-center gap-2 pb-4 relative">
          {/* 뒤로가기 */}
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 top-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)', color: '#6b7280' }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 목록보기 버튼 */}
          <button
            onClick={() => setShowList((v) => !v)}
            className="absolute right-0 top-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)', color: '#6b7280' }}
          >
            {showList ? (
              // 버블뷰로 전환 아이콘
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                <circle cx="8" cy="15" r="5" strokeWidth={1.3} />
                <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
                <circle cx="18" cy="7" r="3" strokeWidth={1.2} />
                <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
                <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.1} />
                <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="currentColor" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
              </svg>
            ) : (
              // 목록뷰로 전환 아이콘
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M3 5h14M3 10h14M3 15h8" strokeLinecap="round" />
              </svg>
            )}
          </button>

          {/* 아바타 */}
          <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.06)', border: '2.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
            {user.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-xl font-bold text-gray-400">{name[0]?.toUpperCase()}</span>}
          </div>

          {/* 이름 + Follow + Info */}
          <div className="flex items-center gap-1.5 w-full mt-1">
            <h1 className="font-extrabold text-gray-800 tracking-tight flex-1" style={{ fontSize: '18px' }}>{user.nickname || name}</h1>
            <button
              onClick={() => followed ? unfollow(name) : follow(name)}
              className="px-4 py-1 rounded-full text-xs font-semibold transition-all"
              style={(() => {
                const isDark = document.documentElement.hasAttribute('data-dark')
                if (followed) return { background: 'var(--input-bg)', color: '#6b7280', border: '1px solid var(--divider)' }
                return isDark
                  ? { background: 'rgba(255,255,255,0.9)', color: '#111', border: 'none' }
                  : { background: 'rgba(30,30,30,0.85)', color: 'white', border: 'none' }
              })()}
            >
              {followed ? 'Following' : 'Follow'}
            </button>
            <button
              onClick={() => setInfoOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <circle cx="10" cy="10" r="8"/><path d="M10 9v5M10 7v.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {user.bio && <p className="text-xs text-gray-400 w-full">{user.bio}</p>}
        </div>

        {/* 탭 (목록보기가 아닐 때만) */}
        {!showList && (
          <div className="flex border-b border-gray-100">
            {[{ id: 'drift', label: 'Drift' }, { id: 'rebubbled', label: 'Rebubbled' }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 text-xs font-semibold transition-all ${activeTab === tab.id ? 'text-gray-800' : 'text-gray-400'}`}
                style={{ borderBottom: activeTab === tab.id ? '2px solid currentColor' : '2px solid transparent' }}
              >{tab.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* 목록 뷰 */}
      {showList && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex border-b border-gray-100" style={{ background: 'var(--nav-bg)' }}>
            {[{ id: 'all', label: 'All' }, { id: 'log', label: 'Log' }, { id: 'pop', label: 'Pop' }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setListTab(tab.id)}
                className={`flex-1 py-2 text-xs font-semibold transition-all ${listTab === tab.id ? 'text-gray-800' : 'text-gray-400'}`}
                style={{ borderBottom: listTab === tab.id ? '2px solid currentColor' : '2px solid transparent' }}
              >{tab.label}</button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-6 grid gap-4">
              {(() => {
                const filtered = listTab === 'all' ? userPosts : listTab === 'log' ? userPosts.filter(p => p.type === 'log' || !p.type) : userPosts.filter(p => p.type === 'pop')
                return filtered.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-10">글이 없습니다.</p>
                  : filtered.map((post) => <PostCard key={post.id} post={post} showMenu />)
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 버블 뷰 */}
      {!showList && (
        <div ref={containerRef} className="relative flex-1 overflow-hidden">
          {activeTab === 'drift' && userPosts.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-gray-300">아직 글이 없습니다.</p>
            </div>
          )}
          {activeTab === 'rebubbled' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-gray-300 text-center">아직 Rebubble한 글이 없습니다.</p>
            </div>
          )}
          {activeTab === 'drift' && bubblesRef.current.map((b) => (
            <BubbleNode
              key={b.id}
              b={b}
              isDragging={dragRef.current?.id === b.id}
              onClick={() => { if (!didDragRef.current) navigate(`/post/${b.id}`) }}
              onMouseDown={(e) => onMouseDown(e, b.id)}
              onTouchStart={(e) => onTouchStart(e, b.id)}
            />
          ))}
        </div>
      )}

      {/* Info 바텀시트 */}
      {infoOpen && (
        <InfoSheet
          onClose={() => setInfoOpen(false)}
          avatar={user.avatar}
          name={user.nickname || name}
          username={name}
          bio={user.bio}
          bubbles={userPosts.length}
          log={userPosts.filter(p => p.type === 'log' || !p.type).length}
          pop={userPosts.filter(p => p.type === 'pop').length}
          followers={followed ? 1 : 0}
          following={0}
          followerUsers={followed ? [{ name: 'me' }] : []}
          followingUsers={[]}
          profileUrl={`${window.location.origin}/user/${name}`}
        />
      )}
    </div>
  )
}
