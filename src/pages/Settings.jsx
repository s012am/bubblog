import { useNavigate } from 'react-router-dom'
import { useTheme, THEMES } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

export default function Settings() {
  const navigate = useNavigate()
  const { themeId, setThemeId } = useTheme()
  const { logout, session } = useAuth()

  return (
    <div className="min-h-screen">
      <div
        className="flex items-center gap-3 px-4 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>설정</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        {/* 테마 */}
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">테마</p>
          <div className="flex gap-2.5 flex-wrap">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className="flex flex-col items-center gap-1.5"
              >
                <div
                  className="w-10 h-10 rounded-2xl transition-all"
                  style={{
                    background: t.bg,
                    border: themeId === t.id ? '2.5px solid #374151' : '2px solid rgba(0,0,0,0.08)',
                    boxShadow: themeId === t.id ? '0 0 0 3px rgba(55,65,81,0.12)' : 'none',
                  }}
                />
                <span className="text-[10px] text-gray-500">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 계정 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">계정</p>
          {[
            { label: '이메일', sub: session?.user?.email || '' },
            { label: '비밀번호 변경', sub: '' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <button className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.sub && <span className="text-xs text-gray-400">{item.sub}</span>}
                  {!item.sub && (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 text-gray-300">
                      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
              {i < arr.length - 1 && <div className="h-px bg-gray-100 mx-5" />}
            </div>
          ))}
          <div className="pb-1" />
        </div>

        {/* 앱 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">앱</p>
          {[
            { label: '알림 설정', sub: '' },
            { label: '개인정보 처리방침', sub: '', to: '/privacy' },
            { label: '이용약관', sub: '', to: '/terms' },
            { label: '오픈소스 라이선스', sub: '', to: '/opensource' },
            { label: '앱 버전', sub: '0.1.0' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <button onClick={() => item.to && navigate(item.to)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.sub && <span className="text-xs text-gray-400">{item.sub}</span>}
                  {item.sub !== '0.1.0' && (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 text-gray-300">
                      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
              {i < arr.length - 1 && <div className="h-px bg-gray-100 mx-5" />}
            </div>
          ))}
          <div className="pb-1" />
        </div>

        {/* 로그아웃 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <button
            className="w-full flex items-center px-5 py-3.5 text-left hover:bg-red-50 transition-colors"
            onClick={async () => { await logout(); navigate('/login') }}
          >
            <span className="text-sm text-red-400">로그아웃</span>
          </button>
        </div>

      </div>
    </div>
  )
}
