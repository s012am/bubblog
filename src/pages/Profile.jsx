import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useProfile } from '../context/ProfileContext'
import { useDraft } from '../context/DraftContext'
import { useFollow } from '../context/FollowContext'
import { useTheme, THEMES } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 1000 / 60)
  if (min < 1) return '방금 전'
  if (min < 60) return `${min}분 전`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}시간 전`
  const day = Math.floor(hour / 24)
  return `${day}일 전`
}

function calcStreak(posts) {
  const dates = new Set(posts.map((p) => p.date ? new Date(p.date).toISOString().slice(0, 10) : null).filter(Boolean))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (dates.has(key)) { streak++ }
    else if (i > 0) { break }
  }
  return streak
}


function StreakGrid({ posts }) {
  const navigate = useNavigate()
  const { themeId } = useTheme()
  const dotColor = (THEMES.find((t) => t.id === themeId) || THEMES[0]).dot
  const today = new Date()
  const [offset, setOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(null)
  const target = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const tYear = target.getFullYear()
  const tMonth = target.getMonth()
  const todayStr = today.toISOString().slice(0, 10)
  const dates = new Set(posts.map((p) => p.date ? new Date(p.date).toISOString().slice(0, 10) : null).filter(Boolean))

  const firstDay = new Date(tYear, tMonth, 1).getDay()
  const daysInMonth = new Date(tYear, tMonth + 1, 0).getDate()
  const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const monthStr = `${tYear}년 ${tMonth + 1}월`

  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1
      const key = `${tYear}-${String(tMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const col = (firstDay + i) % 7
      return { d, key, active: dates.has(key), isToday: key === todayStr, col }
    }),
  ]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button onClick={() => { setOffset((v) => v - 1); setSelectedDate(null) }} className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 transition-colors">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3"><path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-[11px] font-semibold text-gray-400">{monthStr}</span>
        <button onClick={() => { setOffset((v) => Math.min(v + 1, 0)); setSelectedDate(null) }} className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 transition-colors" style={{ opacity: offset === 0 ? 0 : 1, pointerEvents: offset === 0 ? 'none' : 'auto' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3"><path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="flex items-center justify-center h-5" style={{ fontSize: '9px', color: '#d1d5db', fontWeight: 600 }}>{l}</div>
        ))}
      </div>
      <div className="relative grid grid-cols-7 gap-y-1">
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <div key={cell.key} className="flex items-center justify-center py-0.5">
              <button
                onClick={() => {
                  if (!cell.active) return
                  setSelectedDate((v) => v === cell.key ? null : cell.key)
                }}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-transform active:scale-90"
                style={{
                  background: selectedDate === cell.key ? dotColor : cell.active ? dotColor : 'transparent',
                  opacity: cell.active && selectedDate !== cell.key ? 0.8 : 1,
                  outline: cell.isToday && !cell.active ? `1.5px solid ${dotColor}55` : 'none',
                  outlineOffset: '0px',
                  cursor: cell.active ? 'pointer' : 'default',
                  boxShadow: selectedDate === cell.key ? `0 0 0 3px ${dotColor}30` : 'none',
                }}
              >
                <span style={{ fontSize: '10px', fontWeight: cell.active || cell.isToday ? 700 : 400, color: cell.active ? (themeId === 'dark' ? '#1c1c1e' : 'white') : cell.isToday ? (themeId === 'dark' ? '#f3f4f6' : '#374151') : '#9ca3af' }}>
                  {cell.d}
                </span>
              </button>
            </div>
          )
        )}
      </div>

      {selectedDate && (() => {
        const [, selMonth, selDay] = selectedDate.split('-').map(Number)
        const dayPosts = posts.filter((p) => p.date && new Date(p.date).toISOString().slice(0, 10) === selectedDate)
        return (
          <div className="mt-2 flex flex-col gap-1">
            <p className="text-[10px] font-semibold text-gray-400 px-1">{selMonth}월 {selDay}일</p>
            {dayPosts.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/post/${p.id}`)}
                className="w-full text-left px-3 py-2 rounded-xl transition-colors active:opacity-60"
                style={{ background: 'var(--input-bg)' }}
              >
                <span className="text-xs font-medium text-gray-700 line-clamp-1">{p.title}</span>
              </button>
            ))}
          </div>
        )
      })()}
    </div>
  )
}

export default function Profile() {
  const { posts, currentUserId, renameAuthor, refreshBlockedIds } = usePosts()
  const myPosts = posts.filter(p => p.authorId === currentUserId)
  const { profile, setProfile } = useProfile()
  const { drafts, deleteDraft } = useDraft()
  const { followerUsers, followingUsers } = useFollow()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile)
  const [menuOpen, setMenuOpen] = useState(false)
  const [draftDeleteId, setDraftDeleteId] = useState(null)
  const openBlockPage = () => {
    setMenuOpen(false)
    navigate('/settings/blocked')
  }
  const [followSheet, setFollowSheet] = useState(null) // 'followers' | 'following' | null
  const [followTranslate, setFollowTranslate] = useState(40)
  const [followDragging, setFollowDragging] = useState(false)
  const followDragStartY = useRef(0)
  const followDragStartTranslate = useRef(40)
  const fileInputRef = useRef(null)

  const openFollowSheet = (tab) => {
    setFollowTranslate(100)
    setFollowSheet(tab)
    requestAnimationFrame(() => requestAnimationFrame(() => setFollowTranslate(0)))
  }
  const closeFollowSheet = () => { setFollowTranslate(100); setTimeout(() => setFollowSheet(null), 300) }

  const handleFollowDragStart = (e) => {
    followDragStartY.current = e.touches[0].clientY
    followDragStartTranslate.current = followTranslate
    setFollowDragging(true)
  }
  const handleFollowDragMove = (e) => {
    const dy = e.touches[0].clientY - followDragStartY.current
    const panelH = window.innerHeight * 0.85
    setFollowTranslate(Math.max(-3, followDragStartTranslate.current + (dy / panelH) * 100))
  }
  const handleFollowDragEnd = () => {
    setFollowDragging(false)
    if (followTranslate > 60) closeFollowSheet()
    else if (followTranslate > 20) setFollowTranslate(40)
    else setFollowTranslate(0)
  }


  const streak = calcStreak(myPosts)

  const handleSave = () => {
    if (draft.name !== profile.name) renameAuthor(profile.name, draft.name)
    setProfile(draft)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(profile)
    setEditing(false)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setDraft((prev) => ({ ...prev, avatar: ev.target.result }))
    reader.readAsDataURL(file)
  }

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <div
        className="flex items-center justify-between px-4 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '28px' }}>Me</h1>
        {editing ? (
          <div className="flex items-center gap-3">
            <button onClick={handleCancel} className="h-9 px-1 text-sm text-gray-400 hover:text-gray-600 transition-colors">취소</button>
            <button onClick={handleSave} className="h-9 px-1 text-sm font-semibold text-gray-800 hover:text-gray-500 transition-colors">저장</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* 설정 */}
            <button
              onClick={() => navigate('/settings')}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {/* 메뉴 */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
                <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">

        {/* 프로필 카드 */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4 relative"
          style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
        >
          {!editing && (
            <button
              onClick={() => { setDraft(profile); setEditing(true) }}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                <path d="M11.5 2.5a1.5 1.5 0 0 1 2 2L5 13H2v-3L11.5 2.5z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* 왼쪽: 아바타 + 이름 */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 w-20">
            <div className="relative">
              <div
                className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: 'var(--avatar-bg)', border: '2px solid var(--card-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
              >
                {(editing ? draft.avatar : profile.avatar) ? (
                  <img src={editing ? draft.avatar : profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-gray-400">
                    {(editing ? draft.name : profile.name)[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gray-800 text-white flex items-center justify-center shadow-md"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                    <path d="M11 1h4v4M15 1l-6 6M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            {editing ? (
              <div className="flex flex-col gap-1 w-full">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  className="text-center text-xs font-bold text-gray-800 bg-transparent focus:outline-none border-b border-gray-200 w-full"
                  style={{ lineHeight: '1.5', padding: '0 0 1px' }}
                  placeholder="닉네임"
                />
                <input
                  value={draft.id || ''}
                  onChange={(e) => setDraft((prev) => ({ ...prev, id: e.target.value }))}
                  className="text-center text-xs text-gray-400 bg-transparent focus:outline-none border-b border-gray-200 w-full"
                  style={{ lineHeight: '1.5', padding: '0 0 1px' }}
                  placeholder="아이디"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5 w-full">
                <p className="text-xs font-bold text-gray-800 text-center">{profile.name}</p>
                {profile.id && <p className="text-xs text-gray-400 text-center">@{profile.id}</p>}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="w-px self-stretch bg-gray-100" />

          {/* 오른쪽: 통계 + 소개 */}
          <div className="flex-1 flex flex-col gap-3 min-w-0 pt-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-bold text-gray-800">{myPosts.length}</span>
                <span className="text-gray-400" style={{ fontSize: '9px' }}>Bubbles</span>
              </div>
              <div className="w-px h-4 bg-gray-100" />
              <button onClick={() => openFollowSheet('followers')} className="flex flex-col items-center gap-0.5 active:opacity-60 transition-opacity">
                <span className="text-sm font-bold text-gray-800">{followerUsers.length}</span>
                <span className="text-gray-400" style={{ fontSize: '9px' }}>Followers</span>
              </button>
              <div className="w-px h-4 bg-gray-100" />
              <button onClick={() => openFollowSheet('following')} className="flex flex-col items-center gap-0.5 active:opacity-60 transition-opacity">
                <span className="text-sm font-bold text-gray-800">{followingUsers.length}</span>
                <span className="text-gray-400" style={{ fontSize: '9px' }}>Following</span>
              </button>
            </div>

            {editing ? (
              <textarea
                value={draft.bio}
                onChange={(e) => setDraft((prev) => ({ ...prev, bio: e.target.value }))}
                placeholder="소개를 입력하세요"
                className="w-full text-xs text-gray-500 placeholder-gray-300 bg-transparent focus:outline-none resize-none"
                style={{ height: '2.25rem', padding: 0, border: 0, lineHeight: '1.5', overflow: 'hidden' }}
              />
            ) : (
              <p className="text-xs text-gray-400" style={{ height: '2.25rem', lineHeight: '1.5', overflow: 'hidden' }}>
                {profile.bio || 'No bio yet'}
              </p>
            )}
          </div>
        </div>

        {/* 스트릭 카드 */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-4"
          style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Bubble Calendar</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-gray-800">{streak}</span>
              <span className="text-[12px] text-gray-400 font-medium">days in a row</span>
            </div>
          </div>
          <StreakGrid posts={myPosts} />
        </div>

      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* 메뉴 드로어 */}
      {/* 팔로워/팔로잉 바텀시트 */}
      {followSheet && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: `rgba(0,0,0,${0.2 * (1 - followTranslate / 100)})` }}
            onClick={closeFollowSheet}
          />
          <div
            className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl flex flex-col"
            style={{
              height: '85vh',
              background: 'var(--sheet-bg)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 -4px 30px rgba(0,0,0,0.2)',
              transform: `translateY(${followTranslate}%)`,
              transition: followDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* 드래그 핸들 */}
            <div
              className="flex justify-center pt-3 pb-2 flex-shrink-0"
              style={{ touchAction: 'none' }}
              onTouchStart={handleFollowDragStart}
              onTouchMove={handleFollowDragMove}
              onTouchEnd={handleFollowDragEnd}
            >
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            {/* 탭 */}
            <div
              className="flex flex-shrink-0"
              style={{ borderBottom: '1px solid var(--divider)', touchAction: 'none' }}
              onTouchStart={handleFollowDragStart}
              onTouchMove={handleFollowDragMove}
              onTouchEnd={handleFollowDragEnd}
            >
              {[{ key: 'followers', label: 'Followers' }, { key: 'following', label: 'Following' }].map((tab) => (
                <button
                  key={tab.key}
                  onTouchStart={(e) => e.stopPropagation()}
                  onClick={() => setFollowSheet(tab.key)}
                  className="flex-1 py-3 text-sm font-semibold transition-colors"
                  style={{ color: followSheet === tab.key ? 'var(--text-primary, #1f2937)' : '#9ca3af', borderBottom: followSheet === tab.key ? '2px solid currentColor' : '2px solid transparent' }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {/* 목록 */}
            <div className="overflow-y-auto flex-1 px-5 py-3">
              {(followSheet === 'followers' ? followerUsers : followingUsers).length === 0 ? (
                <p className="text-sm text-gray-300 text-center py-10">
                  {followSheet === 'followers' ? '팔로워가 없어요.' : '팔로우한 사람이 없어요.'}
                </p>
              ) : (
                (followSheet === 'followers' ? followerUsers : followingUsers).map((u) => (
                  <button
                    key={u.name}
                    onClick={() => { closeFollowSheet(); navigate(`/user/${u.username}`) }}
                    className="w-full flex items-center gap-3 py-3 active:opacity-60 transition-opacity"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                      {u.avatar
                        ? <img src={u.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                        : <span className="text-sm font-bold text-gray-500">{u.name[0].toUpperCase()}</span>}
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                      <span className="text-sm font-semibold text-gray-800">{u.name}</span>
                      {u.bio && <span className="text-xs text-gray-400 truncate w-full">{u.bio}</span>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setMenuOpen(false)}>
          <div className="flex-1" />
          <div
            className="w-64 h-full flex flex-col pt-10 pb-20 px-5 gap-1"
            style={{ background: 'var(--menu-bg)', backdropFilter: 'blur(20px)', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">메뉴</p>
            {[
              { label: '내 글 통계', icon: 'M4 20V14M8 20V10M12 20V4M16 20V10M20 20V14', path: '/stats' },
              { label: '내 활동', icon: 'M12 8v4l3 3M12 3a9 9 0 1 1 0 18A9 9 0 0 1 12 3z', path: '/activity' },
              { label: '저장된 글', icon: 'M5 3h10a1 1 0 0 1 1 1v13l-6-3-6 3V4a1 1 0 0 1 1-1z', path: '/bookmarks' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-gray-400">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item.label}
              </button>
            ))}
            <button
              onClick={openBlockPage}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-gray-400">
                <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.4 5.4l13.2 13.2" strokeLinecap="round"/>
              </svg>
              차단 목록
            </button>

            {/* 임시저장 */}
            {drafts.length > 0 && (
              <>
                <div className="h-px bg-gray-100 my-2" />
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-3 mb-1">임시저장</p>
                {drafts.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase w-4 flex-shrink-0">{d.type === 'pop' ? 'P' : 'L'}</span>
                    <button
                      onClick={() => navigate(`/write/${d.type}`, { state: { draftId: d.id } })}
                      className="flex-1 text-left text-xs text-gray-600 truncate"
                    >
                      {d.title?.trim() || '제목 없음'}
                    </button>
                    <button
                      onClick={() => setDraftDeleteId(d.id)}
                      className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
                        <path d="M3 4h10M6 4V2h4v2M5 4l.5 9h5L11 4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}

            <div className="flex-1" />
            <button onClick={async () => { await logout(); navigate('/login') }} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      )}

      {/* 임시저장 삭제 확인 다이얼로그 */}
      {draftDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setDraftDeleteId(null)}
        >
          <div
            className="rounded-2xl p-6 flex flex-col gap-4 w-72"
            style={{ background: 'var(--dialog-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <p className="text-sm font-bold text-gray-800 text-center">임시저장 글을 삭제할까요?</p>
              <p className="text-xs text-gray-400 text-center">삭제된 글은 복구할 수 없습니다.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDraftDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 transition-colors"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              >
                취소
              </button>
              <button
                onClick={() => { deleteDraft(draftDeleteId); setDraftDeleteId(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
