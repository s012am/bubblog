import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

const tabs = [
  {
    to: '/home',
    label: 'Home',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5">
        <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H15v-5h-6v5H4a1 1 0 0 1-1-1V10.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/explore',
    label: 'Explore',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/',
    label: 'Drift',
    center: true,
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-7 h-7">
        {/* 왼쪽 큰 버블 */}
        <circle cx="8" cy="15" r="5" strokeWidth={active ? 1.6 : 1.3} />
        <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
        {/* 오른쪽 위 작은 버블 */}
        <circle cx="18" cy="7" r="3" strokeWidth={active ? 1.5 : 1.2} />
        <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
        {/* 오른쪽 아래 아주 작은 버블 */}
        <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={active ? 1.4 : 1.1} />
        <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="currentColor" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'Alert',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5">
        <path d="M6 10a6 6 0 0 1 12 0c0 4 2 6 2 6H4s2-2 2-6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.3 21a2 2 0 0 0 3.4 0" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Me',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} className="w-5 h-5">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomTabBar() {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { unreadCount } = useNotification()

  if (pathname.startsWith('/post/') || pathname.startsWith('/write/')) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2"
      style={{
        height: '64px',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--nav-border)',
        boxShadow: 'var(--nav-shadow-top)',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.center
          ? pathname === '/' || pathname === '/list'
          : pathname === tab.to
        if (tab.center) {
          const driftTo = pathname === '/' && !searchParams.has('list') ? '/?list=1' : '/'
          return (
            <button
              key={tab.to}
              onClick={() => navigate(driftTo)}
              className="flex flex-col items-center justify-center -translate-y-5"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center transition-transform active:scale-95"
                style={{
                  background: active
                    ? 'rgba(40,40,40,0.88)'
                    : 'var(--drift-btn-bg)',
                  border: active
                    ? '1.5px solid rgba(255,255,255,0.2)'
                    : '1.5px solid var(--card-border-soft)',
                  boxShadow: active
                    ? '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : 'var(--card-shadow)',
                  color: active ? 'white' : '#6b7280',
                }}
              >
                {tab.icon(active)}
              </div>
              <span
                className={`mt-1 tracking-widest uppercase ${active ? 'text-gray-800' : 'text-gray-400'}`}
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                }}
              >
                Drift
              </span>
            </button>
          )
        }
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center justify-center gap-0.5 pb-1 pt-2 flex-1 ${active ? 'text-gray-700' : 'text-gray-400'}`}
          >
            <div className="relative">
              {tab.icon(active)}
              {tab.to === '/notifications' && unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full text-white"
                  style={{ background: '#ef4444', fontSize: '9px', fontWeight: 700, minWidth: '14px', height: '14px', padding: '0 3px' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <span
              className={`uppercase ${active ? 'text-gray-800' : 'text-gray-400'}`}
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.2em',
              }}
            >
              {tab.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
