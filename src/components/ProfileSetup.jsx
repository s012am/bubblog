import { useState } from 'react'
import { useProfile } from '../context/ProfileContext'
import { useTheme } from '../context/ThemeContext'

const BUBBLES = [
  {
    id: 'large',
    circle: { cx: 8, cy: 15, r: 5, strokeWidth: 0.8 },
    shine: { cx: 5.9, cy: 12.9, rx: 1.6, ry: 0.9, transform: 'rotate(-30 5.9 12.9)' },
  },
  {
    id: 'medium',
    circle: { cx: 18, cy: 7, r: 3, strokeWidth: 0.72 },
    shine: { cx: 16.9, cy: 5.9, rx: 0.9, ry: 0.5, transform: 'rotate(-30 16.9 5.9)' },
  },
  {
    id: 'small',
    circle: { cx: 19.5, cy: 17.5, r: 1.8, strokeWidth: 0.66 },
    shine: { cx: 18.8, cy: 16.8, rx: 0.55, ry: 0.32, transform: 'rotate(-30 18.8 16.8)' },
  },
]

const THEME_COLORS = { rose: '#e89ec4', warm: '#f2b882', sage: '#6ec48a', cool: '#818cf8' }

export default function ProfileSetup() {
  const { profile, setProfile } = useProfile()
  const { themeId } = useTheme()
  const isDark = themeId === 'dark'
  const color = isDark ? '#f3f4f6' : (THEME_COLORS[themeId] ?? '#1f2937')

  const [nickname, setNickname] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) { setError('닉네임을 입력해주세요.'); return }
    if (trimmed.length > 20) { setError('닉네임은 20자 이하로 입력해주세요.'); return }
    setLoading(true)
    await setProfile({ ...profile, name: trimmed, bio: bio.trim() })
    setLoading(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-8"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" overflow="visible">
            {BUBBLES.map(({ id, circle, shine }) => (
              <g key={id}>
                <circle
                  cx={circle.cx} cy={circle.cy} r={circle.r}
                  stroke={color} strokeWidth={circle.strokeWidth}
                />
                <ellipse
                  cx={shine.cx} cy={shine.cy}
                  rx={shine.rx} ry={shine.ry}
                  fill={color} opacity="0.2"
                  transform={shine.transform}
                />
              </g>
            ))}
          </svg>
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontWeight: 600,
            fontSize: '28px',
            letterSpacing: '-0.02em',
            color,
            lineHeight: 1,
          }}>
            Bubblog
          </span>
          <p className="text-sm text-gray-400 mt-1">닉네임을 설정하고 시작해보세요.</p>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">닉네임 *</label>
            <input
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--divider)', color: 'var(--text)' }}
              placeholder="닉네임 입력 (최대 20자)"
              maxLength={20}
              value={nickname}
              onChange={(e) => { setNickname(e.target.value); setError('') }}
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">한 줄 소개 (선택)</label>
            <input
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--divider)', color: 'var(--text)' }}
              placeholder="간단한 소개를 입력해주세요."
              maxLength={100}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !nickname.trim()}
          className="w-full py-3.5 rounded-2xl text-sm font-bold text-white transition-opacity disabled:opacity-40"
          style={{ background: 'var(--accent)' }}
        >
          {loading ? '저장 중...' : '시작하기'}
        </button>
      </div>
    </div>
  )
}
