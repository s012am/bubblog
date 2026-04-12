import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useFollow } from '../context/FollowContext'

export default function InfoSheet({
  onClose, avatar, name, username, bio, bubbles, log, pop,
  followers, following,
  followerUsers = [], followingUsers = [],
  targetUserId, isOwn, onBlockChange, profileUrl,
}) {
  const startYRef = useRef(null)
  const [dragY, setDragY] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('followers')
  const [ready, setReady] = useState(false)
  const [allowTransition, setAllowTransition] = useState(false)
  const collapsedRef = useRef(null)
  const offsetRef = useRef(0) // translateY when collapsed
  const headerNativeRef = useRef(null) // collapsedRef 겸용
  const listRef = useRef(null)
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const { isFollowing, unfollow } = useFollow()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 2000) }

  // 차단 여부 초기 확인
  useEffect(() => {
    if (!targetUserId) return
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) return
      supabase.from('blocks').select('id').eq('blocker_id', data.user.id).eq('blocked_id', targetUserId).maybeSingle()
        .then(({ data: row }) => setIsBlocked(!!row))
    })
  }, [targetUserId])

  const handleBlock = async () => {
    setMenuOpen(false)
    const { data } = await supabase.auth.getUser()
    if (!data?.user || !targetUserId) return
    if (isBlocked) {
      await supabase.from('blocks').delete().eq('blocker_id', data.user.id).eq('blocked_id', targetUserId)
      setIsBlocked(false)
      showToast('차단이 해제되었습니다')
    } else {
      await supabase.from('blocks').insert({ blocker_id: data.user.id, blocked_id: targetUserId })
      setIsBlocked(true)
      if (username && isFollowing(username)) unfollow(username)
      showToast('차단되었습니다')
    }
    onBlockChange?.()
  }

  const handleReport = async () => {
    setMenuOpen(false)
    const { data } = await supabase.auth.getUser()
    if (!data?.user || !targetUserId) return
    await supabase.from('reports').insert({ reporter_id: data.user.id, reported_user_id: targetUserId })
    showToast('신고가 접수되었습니다')
  }
  const pullYRef = useRef(0)
  const DOWN_THRESHOLD = 80
  const UP_THRESHOLD = 60

  // overscroll-behavior로 Chrome PTR 비활성화 (CSS 레벨)
  useEffect(() => {
    const html = document.documentElement
    const prev = html.style.overscrollBehaviorY
    html.style.overscrollBehaviorY = 'none'
    return () => { html.style.overscrollBehaviorY = prev }
  }, [])

  // 캡처 페이즈에서 모든 touchmove 차단 → 브라우저 PTR 완전 방지
  // 목록 스크롤은 scrollTop으로 직접 처리
  useEffect(() => {
    const list = listRef.current
    let listStartY = 0
    let listScrollStart = 0
    let isPulling = false

    const onDocStart = (e) => {
      if (list && list.contains(e.target)) {
        listStartY = e.touches[0].clientY
        listScrollStart = list.scrollTop
        isPulling = false
      }
    }

    const onDocMove = (e) => {
      e.preventDefault() // 항상 막아서 브라우저 PTR 차단

      if (!list || !list.contains(e.target)) return

      const dy = e.touches[0].clientY - listStartY
      const newScrollTop = listScrollStart - dy

      if (newScrollTop > 0) {
        // 일반 스크롤
        list.scrollTop = newScrollTop
        isPulling = false
        if (pullYRef.current > 0) { pullYRef.current = 0; setPullY(0) }
      } else {
        // 최상단에서 아래로 당김 → PTR 인디케이터
        isPulling = true
        const clamped = Math.min(-newScrollTop * 0.5, 60)
        pullYRef.current = clamped
        setPullY(clamped)
        list.scrollTop = 0
      }
    }

    const onDocEnd = () => {
      if (isPulling && pullYRef.current >= 40) {
        setRefreshing(true)
        setPullY(0)
        setTimeout(() => setRefreshing(false), 900)
      } else if (isPulling) {
        setPullY(0)
      }
      pullYRef.current = 0
      isPulling = false
    }

    document.addEventListener('touchstart', onDocStart, { passive: true, capture: true })
    document.addEventListener('touchmove', onDocMove, { passive: false, capture: true })
    document.addEventListener('touchend', onDocEnd, { passive: true, capture: true })
    return () => {
      document.removeEventListener('touchstart', onDocStart, { capture: true })
      document.removeEventListener('touchmove', onDocMove, { capture: true })
      document.removeEventListener('touchend', onDocEnd, { capture: true })
    }
  }, [])

  // 축소 상태의 높이를 측정해서 collapsed시 translateY 계산
  useLayoutEffect(() => {
    if (collapsedRef.current) {
      const h = collapsedRef.current.offsetHeight
      offsetRef.current = Math.max(0, window.innerHeight * 0.85 - h - 80)
      setReady(true)
      // 초기 위치 설정 후 다음 프레임부터 transition 허용
      requestAnimationFrame(() => setAllowTransition(true))
    }
  }, [])

  function handleTouchStart(e) {
    startYRef.current = e.touches[0].clientY
    setDragY(0)
  }
  function handleTouchMove(e) {
    if (startYRef.current === null) return
    const dy = e.touches[0].clientY - startYRef.current
    setDragY(dy)
  }
  function handleTouchEnd() {
    const dy = dragY
    setDragY(0)
    startYRef.current = null
    if (expanded) {
      if (dy > DOWN_THRESHOLD) setExpanded(false)
    } else {
      if (dy < -UP_THRESHOLD) setExpanded(true)
      else if (dy > DOWN_THRESHOLD) onClose()
    }
  }

  // translateY: 0 = 완전 펼침, offsetRef.current = 축소 상태
  const translateY = Math.max(0, expanded ? Math.max(0, dragY) : offsetRef.current + dragY)
  const isDragging = startYRef.current !== null

  function Stat({ value, label }) {
    return (
      <div className="flex flex-col gap-0.5 items-center">
        <span className="text-xl font-bold text-gray-800">{value}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
    )
  }

  const Divider = () => <div className="w-px h-8 bg-gray-100" />
  const tabs = [
    { key: 'followers', label: 'Followers' },
    { key: 'followings', label: 'Followings' },
  ]
  const currentUsers = activeTab === 'followers' ? followerUsers : followingUsers

  return (
    <>
      {/* 배경: 시트와 완전히 분리 */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', touchAction: 'none' }}
        onClick={onClose}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl flex flex-col"
        style={{
          background: 'var(--sheet-bg)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.2)',
          height: '85dvh',
          transform: `translateY(${translateY}px)`,
          transition: (isDragging || !allowTransition) ? 'none' : 'transform 0.3s ease',
          opacity: ready ? 1 : 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 영역: 드래그 핸들러 + touchAction:none (목록과 분리) */}
        <div
          ref={(el) => { collapsedRef.current = el; headerNativeRef.current = el }}
          style={{ touchAction: 'none' }}
          onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e) }}
          onTouchMove={(e) => { e.stopPropagation(); handleTouchMove(e) }}
          onTouchEnd={(e) => { e.stopPropagation(); handleTouchEnd(e) }}
        >
          {/* 핸들 */}
          <div className="flex justify-center pt-5 pb-1">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          {/* 프로필 + 통계 */}
          <div className="px-6 pt-3 pb-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                {avatar
                  ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-base font-bold text-gray-400">{name[0]?.toUpperCase()}</span>}
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <p className="font-bold text-gray-800">{name}</p>
                  {username && <p className="text-xs text-gray-400">@{username}</p>}
                </div>
                <div className="flex items-center gap-2.5">
                  <button className="text-xs text-gray-500" onClick={() => { setActiveTab('followers'); setExpanded(true) }}>
                    <span className="font-bold text-gray-800">{followers}</span> Followers
                  </button>
                  <span className="text-gray-200 text-xs">·</span>
                  <button className="text-xs text-gray-500" onClick={() => { setActiveTab('followings'); setExpanded(true) }}>
                    <span className="font-bold text-gray-800">{following}</span> Followings
                  </button>
                </div>
                {bio && <p className="text-xs text-gray-400">{bio}</p>}
              </div>
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ border: '1px solid rgba(0,0,0,0.08)' }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <circle cx="10" cy="4" r="1.5"/><circle cx="10" cy="10" r="1.5"/><circle cx="10" cy="16" r="1.5"/>
                  </svg>
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-50" onClick={() => setMenuOpen(false)} />
                    <div
                      className="absolute right-0 top-10 z-50 w-32 rounded-2xl overflow-hidden"
                      style={{ background: 'var(--dropdown-bg, var(--card-bg))', backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid var(--divider)' }}
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          const url = profileUrl || window.location.href
                          if (navigator.share) navigator.share({ title: name, url })
                          else navigator.clipboard.writeText(url)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400">
                          <circle cx="12" cy="3" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="13" r="1.8"/>
                          <path d="M5.8 9l4.4 2.5M10.2 4.5L5.8 7" strokeLinecap="round"/>
                        </svg>
                        공유
                      </button>
                      {!isOwn && (
                        <>
                          <div className="h-px bg-gray-100" />
                          <button
                            onClick={handleBlock}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                              <circle cx="8" cy="8" r="6.5"/><path d="M3.4 3.4l9.2 9.2" strokeLinecap="round"/>
                            </svg>
                            {isBlocked ? '차단 해제' : '차단'}
                          </button>
                          <div className="h-px bg-gray-100" />
                          <button
                            onClick={handleReport}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                          >
                            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                              <path d="M8 1.5L1.5 13h13L8 1.5z" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 6v3.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none"/>
                            </svg>
                            신고
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* 토스트 */}
              {toastMsg && (
                <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full text-xs font-semibold text-white whitespace-nowrap" style={{ background: 'rgba(30,30,30,0.85)', backdropFilter: 'blur(8px)' }}>
                  {toastMsg}
                </div>
              )}
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center">
              <div className="flex-1 flex justify-center"><Stat value={bubbles} label="Bubbles" /></div>
              <Divider />
              <div className="flex-1 flex justify-center"><Stat value={log} label="Logs" /></div>
              <Divider />
              <div className="flex-1 flex justify-center"><Stat value={pop} label="Pops" /></div>
            </div>
          </div>
        </div>

        {/* 확장 영역: touchAction pan-y로 목록 스크롤 허용 */}
        <div className="flex flex-col flex-1 min-h-0" style={{ touchAction: 'pan-y' }}>
          <div className="h-px bg-gray-100 mx-6 flex-shrink-0" />
          <div className="flex px-6 pt-2 flex-shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  color: activeTab === tab.key ? 'var(--text-primary, #1f2937)' : '#9ca3af',
                  borderBottom: activeTab === tab.key ? '2px solid currentColor' : '2px solid transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* 새로고침 인디케이터 */}
          <div
            className="flex justify-center items-center overflow-hidden transition-all"
            style={{ height: refreshing ? 40 : pullY > 0 ? pullY : 0 }}
          >
            {refreshing ? (
              <svg className="w-5 h-5 text-gray-300 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-gray-300"
                style={{ transform: `rotate(${Math.min(pullY / 40 * 180, 180)}deg)`, transition: 'none' }}>
                <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <div ref={listRef} className="overflow-y-auto px-6 py-3 pb-24 flex flex-col gap-5">
            {currentUsers.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-8">
                {activeTab === 'followers' ? '아직 팔로워가 없습니다.' : '팔로우한 사람이 없습니다.'}
              </p>
            ) : currentUsers.map((u) => (
              u.linkTo
                ? <Link key={u.name} to={u.linkTo} className="flex items-center gap-3" onClick={onClose}>
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-gray-500">{u.name[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                      {u.bio && <p className="text-xs text-gray-400 truncate">{u.bio}</p>}
                    </div>
                  </Link>
                : <div key={u.name} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold text-gray-500">{u.name[0]?.toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                      {u.bio && <p className="text-xs text-gray-400 truncate">{u.bio}</p>}
                    </div>
                  </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
