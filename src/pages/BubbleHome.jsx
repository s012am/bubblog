import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useProfile } from '../context/ProfileContext'
import { useRebubble } from '../context/RebubbleContext'
import { useFollow } from '../context/FollowContext'
import { supabase } from '../lib/supabase'
import InfoSheet from '../components/InfoSheet'
import PostCard from '../components/PostCard'

const DELETE_ZONE_H = 64

function formatRemaining(expiresAt) {
  const ms = expiresAt - Date.now()
  if (ms <= 0) return '만료'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}초`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간`
  const d = Math.floor(h / 24)
  return `${d}일`
}

// 포스트별 버블 크기
const RADII = [65, 58, 54, 62]


function initBubbles(w, h, posts) {
  const bubbles = []
  for (let i = 0; i < posts.length; i++) {
    const r = RADII[i] ?? 58
    let x, y, tries = 0
    do {
      x = r + Math.random() * (w - r * 2)
      y = r + Math.random() * (h - r * 2)
      tries++
    } while (
      tries < 100 &&
      bubbles.some((b) => Math.hypot(b.x - x, b.y - y) < b.r + r + 10)
    )
    bubbles.push({
      id: posts[i].id,
      post: posts[i],
      r,
      x, y,
      vx: (Math.random() - 0.5) * 3.0,
      vy: (Math.random() - 0.5) * 3.0,
      mass: r,
    })
  }
  return bubbles
}

export default function BubbleHome() {
  const containerRef = useRef(null)
  const bubblesRef = useRef([])
  const rafRef = useRef(null)
  const lastRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const dragRef = useRef(null) // { id, offsetX, offsetY, prevX, prevY, prevTime }
  const didDragRef = useRef(false)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { posts, deletePost, currentUserId } = usePosts()
  const { profile } = useProfile()
  const { rebubbledIds, toggle: toggleRebubble } = useRebubble()
  const { followVersion } = useFollow()
  const myPosts = posts.filter((p) => p.authorId === currentUserId)
  const popCount = myPosts.filter((p) => p.type === 'pop').length
  const logCount = myPosts.filter((p) => p.type === 'log' || !p.type).length
  const [infoOpen, setInfoOpen] = useState(false)
  const [followerUsers, setFollowerUsers] = useState([])
  const [followingUsers, setFollowingUsers] = useState([])

  // 현재 유저의 팔로워/팔로잉 목록 fetch
  useEffect(() => {
    if (!currentUserId) return
    const mapProfile = (p) => ({
      name: p.nickname || p.username,
      avatar: p.avatar_url || null,
      bio: p.bio || '',
      linkTo: `/user/${p.username}`,
    })
    ;(async () => {
      const { data: fwrRows } = await supabase.from('follows').select('follower_id').eq('following_id', currentUserId)
      if (fwrRows?.length > 0) {
        const { data: fps } = await supabase.from('profiles').select('username, nickname, avatar_url, bio').in('id', fwrRows.map(r => r.follower_id))
        setFollowerUsers((fps || []).map(mapProfile))
      } else {
        setFollowerUsers([])
      }

      const { data: fwgRows } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId)
      if (fwgRows?.length > 0) {
        const { data: fps } = await supabase.from('profiles').select('username, nickname, avatar_url, bio').in('id', fwgRows.map(r => r.following_id))
        setFollowingUsers((fps || []).map(mapProfile))
      } else {
        setFollowingUsers([])
      }
    })()
  }, [currentUserId, followVersion])

  const [activeTab, setActiveTab] = useState('drift')
  const [tick, setTick] = useState(0)
  const [fabOpen, setFabOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showList, setShowList] = useState(() => searchParams.has('list'))

  useEffect(() => {
    setShowList(searchParams.has('list'))
  }, [searchParams])
  const [listTab, setListTab] = useState('all')
  const [overDelete, setOverDelete] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null) // { id, title }

  const reset = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    sizeRef.current = { w, h }
    const visiblePosts = activeTab === 'rebubbled'
      ? posts.filter((p) => rebubbledIds.includes(p.id)).slice(0, 15)
      : posts.filter((p) => p.authorId === currentUserId).slice(0, 15)
    bubblesRef.current = initBubbles(w, h, visiblePosts)
  }, [posts, activeTab, rebubbledIds, currentUserId])

  useEffect(() => {
    reset()

    const onResize = () => reset()
    window.addEventListener('resize', onResize)

    const DAMPING = 0.999
    const MAX_SPEED = 10.0
    const WANDER = 0.05

    const loop = (time) => {
      if (!lastRef.current) lastRef.current = time
      const dt = Math.min((time - lastRef.current) / 16, 3)
      lastRef.current = time

      const { w, h } = sizeRef.current
      const bs = bubblesRef.current
      const draggingId = dragRef.current?.id

      for (const b of bs) {
        if (b.id === draggingId) continue  // 드래그 중인 버블은 물리 스킵

        b.vx += (Math.random() - 0.5) * WANDER * dt
        b.vy += (Math.random() - 0.5) * WANDER * dt

        b.x += b.vx * dt
        b.y += b.vy * dt

        b.vx *= DAMPING
        b.vy *= DAMPING

        const spd = Math.hypot(b.vx, b.vy)
        if (spd > MAX_SPEED) {
          b.vx = (b.vx / spd) * MAX_SPEED
          b.vy = (b.vy / spd) * MAX_SPEED
        }

        if (b.x - b.r < 0)  { b.x = b.r;     b.vx =  Math.abs(b.vx) * 0.7 }
        if (b.x + b.r > w)  { b.x = w - b.r; b.vx = -Math.abs(b.vx) * 0.7 }
        if (b.y - b.r < 0)  { b.y = b.r;     b.vy =  Math.abs(b.vy) * 0.7 }
        if (b.y + b.r > h)  { b.y = h - b.r; b.vy = -Math.abs(b.vy) * 0.7 }
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
          const aFixed = a.id === draggingId
          const bFixed = b.id === draggingId

          // 1) 반발 속도 — 겹친 만큼 밀어내는 힘 (매 프레임 지속)
          const repulse = overlap * 0.5
          if (!aFixed) { a.vx -= nx * repulse; a.vy -= ny * repulse }
          if (!bFixed) { b.vx += nx * repulse; b.vy += ny * repulse }

          // 2) 탄성 충돌 속도 교환 (접근 중일 때만)
          const dvx = a.vx - b.vx, dvy = a.vy - b.vy
          const dot = dvx * nx + dvy * ny
          if (dot > 0) {
            const boost = 1.4
            if (aFixed) {
              b.vx += boost * 2 * dot * nx; b.vy += boost * 2 * dot * ny
            } else if (bFixed) {
              a.vx -= boost * 2 * dot * nx; a.vy -= boost * 2 * dot * ny
            } else {
              const imp = (boost * 2 * dot) / (a.mass + b.mass)
              a.vx -= imp * b.mass * nx; a.vy -= imp * b.mass * ny
              b.vx += imp * a.mass * nx; b.vy += imp * a.mass * ny
            }
          }

          // 3) 위치 보정 (기하학적 겹침 즉시 해소)
          if (aFixed) {
            b.x += nx * overlap; b.y += ny * overlap
          } else if (bFixed) {
            a.x -= nx * overlap; a.y -= ny * overlap
          } else {
            const totalMass = a.mass + b.mass
            a.x -= nx * overlap * (b.mass / totalMass); a.y -= ny * overlap * (b.mass / totalMass)
            b.x += nx * overlap * (a.mass / totalMass); b.y += ny * overlap * (a.mass / totalMass)
          }
        }
      }

      setTick((n) => n + 1)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [reset])

  // 마우스 드래그 핸들러
  const onMouseDown = useCallback((e, bubbleId) => {
    e.preventDefault()
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const b = bubblesRef.current.find((b) => b.id === bubbleId)
    if (!b) return

    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    didDragRef.current = false
    dragRef.current = {
      id: bubbleId,
      offsetX: mx - b.x,
      offsetY: my - b.y,
      history: [{ x: mx, y: my, t: performance.now() }],
    }
    setIsDragging(true)
    setOverDelete(false)

    const onMouseMove = (e) => {
      if (!dragRef.current) return
      didDragRef.current = true
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
      if (!b) return
      const now = performance.now()
      const prevX = b.x, prevY = b.y
      b.x = mx - dragRef.current.offsetX
      b.y = my - dragRef.current.offsetY
      const last = dragRef.current.history[dragRef.current.history.length - 1]
      const dt = Math.max(now - last.t, 1)
      b.vx = (b.x - prevX) / dt * 16
      b.vy = (b.y - prevY) / dt * 16
      dragRef.current.history.push({ x: mx, y: my, t: now })
      dragRef.current.history = dragRef.current.history.filter((p) => now - p.t < 80)
      setOverDelete(b.y > sizeRef.current.h - DELETE_ZONE_H)
    }

    const onMouseUp = (e) => {
      if (!dragRef.current) return
      const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
      const inZone = b && b.y > sizeRef.current.h - DELETE_ZONE_H
      if (b) {
        if (inZone) {
          // 삭제 존에 놓음 → 원위置로 되돌리고 확인 요청
          b.x = sizeRef.current.w / 2
          b.y = sizeRef.current.h / 2
          b.vx = 0; b.vy = 0
          setDeleteTarget({ id: b.id, title: b.post.title })
        } else {
          const history = dragRef.current.history
          if (history.length >= 2) {
            const first = history[0], last = history[history.length - 1]
            const dt = Math.max(last.t - first.t, 1)
            b.vx = ((last.x - first.x) / dt) * 16
            b.vy = ((last.y - first.y) / dt) * 16
          } else { b.vx = 0; b.vy = 0 }
        }
      }
      dragRef.current = null
      setIsDragging(false)
      setOverDelete(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  // 터치 드래그 핸들러
  const onTouchStart = useCallback((e, bubbleId) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const touch = e.touches[0]
    const b = bubblesRef.current.find((b) => b.id === bubbleId)
    if (!b) return

    const mx = touch.clientX - rect.left
    const my = touch.clientY - rect.top
    dragRef.current = {
      id: bubbleId,
      offsetX: mx - b.x,
      offsetY: my - b.y,
      history: [{ x: mx, y: my, t: performance.now() }],
    }
    setIsDragging(true)
    setOverDelete(false)

    const onTouchMove = (e) => {
      e.preventDefault()
      if (!dragRef.current) return
      const rect = el.getBoundingClientRect()
      const touch = e.touches[0]
      const mx = touch.clientX - rect.left
      const my = touch.clientY - rect.top
      const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
      if (!b) return
      b.x = mx - dragRef.current.offsetX
      b.y = my - dragRef.current.offsetY
      const now = performance.now()
      dragRef.current.history.push({ x: mx, y: my, t: now })
      dragRef.current.history = dragRef.current.history.filter((p) => now - p.t < 80)
      setOverDelete(b.y > sizeRef.current.h - DELETE_ZONE_H)
    }

    const onTouchEnd = (e) => {
      if (!dragRef.current) return
      const b = bubblesRef.current.find((b) => b.id === dragRef.current.id)
      const inZone = b && b.y > sizeRef.current.h - DELETE_ZONE_H
      if (b) {
        if (inZone) {
          b.x = sizeRef.current.w / 2
          b.y = sizeRef.current.h / 2
          b.vx = 0; b.vy = 0
          setDeleteTarget({ id: b.id, title: b.post.title })
        } else {
          const history = dragRef.current.history
          if (history.length >= 2) {
            const first = history[0], last = history[history.length - 1]
            const dt = Math.max(last.t - first.t, 1)
            b.vx = ((last.x - first.x) / dt) * 16
            b.vy = ((last.y - first.y) / dt) * 16
          } else { b.vx = 0; b.vy = 0 }
        }
      }
      dragRef.current = null
      setIsDragging(false)
      setOverDelete(false)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
  }, [])

  return (
    <div className="flex flex-col" style={{ height: '100dvh', paddingBottom: '64px' }}>
      {/* 헤더 */}
      <div
        className="px-6 pt-4 pb-0"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)' }}
      >
        {/* 프로필 중앙 */}
        <div className="flex flex-col items-center gap-2 pb-4 relative">
          {/* 목록/버블 토글 버튼 */}
          <button
            onClick={() => {
              const next = !showList
              setShowList(next)
              setSearchParams(next ? { list: '1' } : {})
            }}
            className="absolute right-0 top-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'var(--card-bg)', backdropFilter: 'blur(12px)',
              border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)',
              color: '#6b7280',
            }}
          >
            {showList ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
                <circle cx="8" cy="15" r="5" strokeWidth={1.3} />
                <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
                <circle cx="18" cy="7" r="3" strokeWidth={1.2} />
                <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
                <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.1} />
                <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="currentColor" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <path d="M3 5h14M3 10h14M3 15h8" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <Link to="/profile">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.06)', border: '2.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
            >
              {profile.avatar ? (
                <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-gray-400">{profile.name[0]?.toUpperCase()}</span>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-1.5 w-full mt-1">
            <h1 className="font-extrabold text-gray-800 tracking-tight flex-1" style={{ fontSize: '18px' }}>{profile.name}</h1>
            {/* Info */}
            <button
              onClick={() => setInfoOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 transition-colors"
              style={{ border: '1px solid rgba(0,0,0,0.08)' }}
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <circle cx="10" cy="10" r="8"/>
                <path d="M10 9v5M10 7v.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 w-full">{profile.bio || 'No bio yet'}</p>
        </div>

        {/* 탭 */}
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
                const myPosts = posts.filter(p => p.authorId === currentUserId)
                const filtered = listTab === 'all' ? myPosts : listTab === 'log' ? myPosts.filter(p => p.type === 'log' || !p.type) : myPosts.filter(p => p.type === 'pop')
                return filtered.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-10">글이 없습니다.</p>
                  : filtered.map((post) => <PostCard key={post.id} post={post} showMenu />)
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 버블 캔버스 */}
      {!showList && <div ref={containerRef} className="relative flex-1 overflow-hidden">
        {activeTab === 'drift' && posts.filter(p => p.authorId === currentUserId).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-300 text-center leading-relaxed">
              첫 번째 버블을 띄워보세요.
            </p>
          </div>
        )}
        {activeTab === 'rebubbled' && posts.filter(p => rebubbledIds.includes(p.id)).length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-300 text-center leading-relaxed">
              마음에 드는 Bubble을<br/>탐색해 보세요.
            </p>
          </div>
        )}
        {bubblesRef.current.map((b) => (
          <BubbleNode
            key={b.id}
            b={b}
            isDragging={dragRef.current?.id === b.id}
            onClick={() => { if (!didDragRef.current) navigate(`/post/${b.id}`) }}
            onMouseDown={(e) => onMouseDown(e, b.id)}
            onTouchStart={(e) => onTouchStart(e, b.id)}
          />
        ))}

        {/* 삭제 존 */}
        {isDragging && (
          <div
            className="absolute left-0 right-0 bottom-0 flex items-center justify-center gap-2 transition-all pointer-events-none"
            style={{
              height: DELETE_ZONE_H,
              background: overDelete
                ? 'rgba(239,68,68,0.15)'
                : 'rgba(0,0,0,0.04)',
              borderTop: overDelete
                ? '1.5px solid rgba(239,68,68,0.3)'
                : '1.5px dashed rgba(0,0,0,0.1)',
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke={overDelete ? '#ef4444' : '#9ca3af'} strokeWidth="1.6" className="w-4 h-4" style={{ transition: 'stroke 0.15s' }}>
              <path d="M3 5h14M7 5V3h6v2M16 5l-.7 11a1 1 0 0 1-1 .9H5.7a1 1 0 0 1-1-.9L4 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-xs font-medium transition-colors" style={{ color: overDelete ? '#ef4444' : '#9ca3af' }}>
              여기로 끌어서 삭제
            </span>
          </div>
        )}

        {/* FAB 바깥 클릭 오버레이 */}
        {fabOpen && (
          <div className="fixed inset-0 z-20" onClick={() => setFabOpen(false)} />
        )}

        {/* FAB */}
        <div className="absolute bottom-5 right-5 flex flex-col items-end gap-3" style={{ zIndex: 30 }}>
          {/* 옵션 버튼들 */}
          {fabOpen && (
            <>
              {['pop', 'log'].map((type, i) => (
                <button
                  key={type}
                  onClick={() => { setFabOpen(false); navigate(`/write/${type}`) }}
                  className="active:scale-95 hover:opacity-90"
                  style={{
                    background: 'rgba(25,25,25,0.82)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '999px',
                    padding: '10px 24px',
                    color: 'rgba(255,255,255,0.88)',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                    animation: `fabSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1) both`,
                    animationDelay: `${i * 0.06}s`,
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </>
          )}

          {/* + 버튼 */}
          <button
            onClick={() => setFabOpen((v) => !v)}
            className="w-13 h-13 flex items-center justify-center rounded-full shadow-lg transition-all active:scale-95"
            style={{
              width: '52px',
              height: '52px',
              background: 'rgba(30,30,30,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'white',
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"
              style={{ transform: fabOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            >
              <path d="M10 4v12M4 10h12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>}

      {/* 삭제 확인 다이얼로그 */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-72 rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab === 'rebubbled' ? (
              <>
                <p className="text-sm font-semibold text-gray-800 text-center">Rebubble을 취소할까요?</p>
                <p className="text-xs text-gray-400 text-center -mt-2">내 Rebubbled 탭에서 사라집니다.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-800 text-center">삭제하시겠습니까?</p>
                <p className="text-xs text-gray-400 text-center -mt-2">삭제된 글은 복구할 수 없습니다.</p>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (activeTab === 'rebubbled') {
                    toggleRebubble(deleteTarget.id)
                  } else {
                    deletePost(deleteTarget.id)
                  }
                  setDeleteTarget(null)
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors"
              >
                {activeTab === 'rebubbled' ? '확인' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Info 바텀시트 */}
      {infoOpen && (
        <InfoSheet
          onClose={() => setInfoOpen(false)}
          avatar={profile.avatar}
          name={profile.name}
          username={profile.id}
          bio={profile.bio}
          bubbles={posts.length}
          log={logCount}
          pop={popCount}
          followers={followerUsers.length}
          following={followingUsers.length}
          followerUsers={followerUsers}
          followingUsers={followingUsers}
          profileUrl={`${window.location.origin}/`}
        />
      )}
    </div>
  )
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
        width: b.r * 2,
        height: b.r * 2,
        left: b.x - b.r,
        top: b.y - b.r,
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
      {/* 좌측 상단 반사광 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '40%',
          height: '30%',
          top: '10%',
          left: '8%',
          borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.60)',
          filter: 'blur(5px)',
        }}
      />

      <div className="relative z-10 px-4">
        {b.post.expiresAt ? (
          <p className="text-[10px] font-medium mb-1 tracking-wide uppercase" style={{ color: '#9ca3af' }}>
            {formatRemaining(b.post.expiresAt)}
          </p>
        ) : (
          <p className="text-3xl font-light mb-0.5 leading-none" style={{ color: '#9ca3af' }}>∞</p>
        )}
        <p className="text-xs font-bold text-gray-700 leading-snug line-clamp-3">
          {b.post.title}
        </p>
      </div>
    </div>
  )
}
