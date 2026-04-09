import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'
import { useProfile } from '../context/ProfileContext'
import { SAMPLE_USERS } from '../data/sampleUsers'
import { useTheme, THEMES } from '../context/ThemeContext'

function timeAgo(date) {
  const diff = Date.now() - date
  const m = Math.floor(diff / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}

const TYPE_CONFIG = {
  follow: {
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
        <circle cx="10" cy="7" r="3.5" />
        <path d="M3 18c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    ),
    message: (n, onNameClick) => <><button className="font-semibold" onClick={onNameClick}>{n.from}</button>님이 회원님을 팔로우했습니다.</>,
  },
  like: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" className="w-3.5 h-3.5">
        <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" />
      </svg>
    ),
    message: (n, onNameClick) => <><button className="font-semibold" onClick={onNameClick}>{n.from}</button>님이 <span className="font-semibold">'{n.postTitle}'</span>에 좋아요를 눌렀습니다.</>,
  },
  comment: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    message: (n, onNameClick) => <><button className="font-semibold" onClick={onNameClick}>{n.from}</button>님이 <span className="font-semibold">'{n.postTitle}'</span>에 댓글을 남겼습니다.{n.commentText && <span className="block text-xs text-gray-400 mt-0.5">"{n.commentText}"</span>}</>,
  },
  rebubble: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
        <circle cx="8" cy="15" r="5" strokeWidth={1.6} />
        <circle cx="18" cy="7" r="3" strokeWidth={1.5} />
        <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.4} />
      </svg>
    ),
    message: (n, onNameClick) => <><button className="font-semibold" onClick={onNameClick}>{n.from}</button>님이 <span className="font-semibold">'{n.postTitle}'</span>을 Rebubble 했습니다.</>,
  },
}

function SwipeableNotification({ children, onDelete }) {
  const startX = useRef(null)
  const [translateX, setTranslateX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const OPEN_X = -72
  const THRESHOLD = 36

  const onTouchStart = (e) => { startX.current = e.touches[0].clientX; setSwiping(true) }
  const onTouchMove = (e) => {
    if (startX.current === null) return
    const dx = e.touches[0].clientX - startX.current + (translateX === OPEN_X ? OPEN_X : 0)
    setTranslateX(Math.max(Math.min(dx, 0), -100))
  }
  const onTouchEnd = () => {
    setSwiping(false)
    startX.current = null
    if (translateX < OPEN_X + THRESHOLD) setTranslateX(OPEN_X)
    else setTranslateX(0)
  }

  const handleDelete = () => {
    setDeleting(true)
    setTranslateX(-window.innerWidth)
    setTimeout(onDelete, 260)
  }

  const handleContentClick = () => {
    if (translateX !== 0) setTranslateX(0)
  }

  return (
    <div className="relative overflow-hidden" style={{ maxHeight: deleting ? 0 : 200, transition: deleting ? 'max-height 0.26s ease' : undefined }}>
      {/* 삭제 버튼 */}
      <div className="absolute inset-y-0 right-0 flex items-center" style={{ width: 72, background: '#fca5a5' }}>
        <button onClick={handleDelete} className="w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" className="w-5 h-5">
            <path d="M3 5h14M7 5V3h6v2M16 5l-.7 11a1 1 0 0 1-1 .9H5.7a1 1 0 0 1-1-.9L4 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {/* 콘텐츠 */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleContentClick}
        style={{ transform: `translateX(${translateX}px)`, transition: swiping ? 'none' : 'transform 0.22s ease', background: 'var(--dialog-bg)' }}
      >
        {children}
      </div>
    </div>
  )
}

export default function Alert() {
  const navigate = useNavigate()
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotification()
  const { profile } = useProfile()
  const { themeId } = useTheme()
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0]
  const unreadBg = theme.unread
  const dotColor = theme.dot

  function getUser(name) {
    if (name === profile.name) return { name: profile.name, avatar: profile.avatar }
    return SAMPLE_USERS.find((u) => u.name === name) ?? { name, avatar: null }
  }

  function handleProfileClick(e, n) {
    e.stopPropagation()
    markRead(n.id)
    const isSample = SAMPLE_USERS.some((u) => u.name === n.from)
    navigate(isSample ? `/user/${n.from}` : '/')
  }

  function handleContentClick(n) {
    markRead(n.id)
    if (n.type === 'follow') {
      const isSample = SAMPLE_USERS.some((u) => u.name === n.from)
      navigate(isSample ? `/user/${n.from}` : '/')
    } else if (n.type === 'comment' && n.postId) {
      navigate(`/post/${n.postId}`, { state: { openComments: true } })
    } else if (n.postId) {
      navigate(`/post/${n.postId}`)
    }
  }

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-0 z-30 px-5 pt-5 pb-3 flex items-center justify-between"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--divider)' }}
      >
        <h1 className="text-base font-extrabold text-gray-800">알림</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
            모두 읽음
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24 gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="w-12 h-12 text-gray-200">
              <path d="M6 10a6 6 0 0 1 12 0c0 4 2 6 2 6H4s2-2 2-6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10.3 21a2 2 0 0 0 3.4 0" strokeLinecap="round" />
            </svg>
            <p className="text-sm text-gray-300">아직 알림이 없습니다.</p>
          </div>
        ) : (
          <div>
            {[...notifications].sort((a, b) => b.date - a.date).map((n) => {
              const config = TYPE_CONFIG[n.type]
              if (!config) return null
              const user = getUser(n.from)
              return (
                <SwipeableNotification key={n.id} onDelete={() => deleteNotification(n.id)}>
                  <div
                    className="flex items-start gap-3 px-5 py-4"
                    style={{ borderBottom: '1px solid var(--divider-soft)', background: n.read ? 'var(--dialog-bg)' : unreadBg }}
                  >
                    <button
                      onClick={(e) => handleProfileClick(e, n)}
                      className="relative flex-shrink-0 mt-0.5 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--avatar-bg)' }}>
                        {user.avatar
                          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          : <span className="text-sm font-bold text-gray-500">{user.name[0]?.toUpperCase()}</span>}
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--unread-indicator-bg)', boxShadow: '0 0 0 2px var(--dialog-bg)', color: 'white' }}
                      >
                        <span style={{ transform: 'scale(0.8)', display: 'flex' }}>{config.icon}</span>
                      </div>
                    </button>
                    <div
                      onClick={() => handleContentClick(n)}
                      className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity cursor-pointer"
                    >
                      <p className="text-sm text-gray-700 leading-snug">
                        {config.message(n, (e) => { e.stopPropagation(); handleProfileClick(e, n) })}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(n.date)}</p>
                    </div>
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: dotColor }} />
                    )}
                  </div>
                </SwipeableNotification>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
