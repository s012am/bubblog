import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

const NOTIF_TYPES = [
  { key: 'like',     label: '좋아요',  desc: '내 글에 좋아요가 달릴 때' },
  { key: 'rebubble', label: '리버블',  desc: '내 글이 리버블될 때' },
  { key: 'follow',   label: '팔로우',  desc: '누군가 나를 팔로우할 때' },
  { key: 'comment',  label: '댓글',    desc: '내 글에 댓글이 달릴 때' },
  { key: 'reply',    label: '답글',    desc: '내 댓글에 답글이 달릴 때' },
  { key: 'mention',  label: '멘션',    desc: '글이나 댓글에서 나를 멘션할 때' },
]

export default function NotificationSettings() {
  const navigate = useNavigate()
  const { prefs, updatePref } = useNotification()

  return (
    <div className="min-h-screen">
      <div
        className="flex items-center gap-3 px-4 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>알림 설정</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          {NOTIF_TYPES.map(({ key, label, desc }, i) => (
            <div key={key}>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => updatePref(key, !prefs[key])}
                  className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200"
                  style={{ background: prefs[key] !== false ? '#22c55e' : '#e5e7eb' }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: prefs[key] !== false ? 'translateX(21px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
              {i < NOTIF_TYPES.length - 1 && <div className="h-px bg-gray-100 mx-5" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
