import { useState } from 'react'
import { useProfile } from '../context/ProfileContext'

export default function ProfileSetup() {
  const { profile, setProfile } = useProfile()
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
        <div className="text-center">
          <div className="text-3xl mb-2">🫧</div>
          <h1 className="text-xl font-extrabold text-gray-800">프로필 설정</h1>
          <p className="text-sm text-gray-400 mt-1">다른 사람들에게 보여질 닉네임을 설정해주세요.</p>
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
