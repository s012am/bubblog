import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function DeleteAccount() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [confirmed, setConfirmed] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setDeleting(false)
      alert('탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.')
      return
    }
    await logout()
    navigate('/login', { replace: true })
  }

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
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>계정 탈퇴</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
        <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <p className="text-sm font-semibold text-gray-700">탈퇴 전에 확인해주세요</p>
          <ul className="flex flex-col gap-2">
            {[
              '작성한 모든 글과 댓글이 삭제됩니다.',
              '팔로우/팔로워 정보가 모두 삭제됩니다.',
              '좋아요, 리버블, 북마크 정보가 삭제됩니다.',
              '삭제된 계정은 복구할 수 없습니다.',
            ].map((text) => (
              <li key={text} className="flex items-start gap-2 text-xs text-gray-400">
                <span className="mt-0.5 text-red-300">•</span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <label className="flex items-center gap-3 px-1 cursor-pointer">
          <div
            onClick={() => setConfirmed(v => !v)}
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ background: confirmed ? '#ef4444' : 'var(--input-bg)', border: confirmed ? 'none' : '1.5px solid var(--divider)' }}
          >
            {confirmed && (
              <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" className="w-3 h-3">
                <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span className="text-sm text-gray-500">위 내용을 모두 확인했으며 탈퇴에 동의합니다.</span>
        </label>

        <button
          onClick={handleDelete}
          disabled={!confirmed || deleting}
          className="w-full h-12 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-30"
          style={{ background: 'rgba(239,68,68,0.85)' }}
        >
          {deleting ? '탈퇴 중...' : '탈퇴하기'}
        </button>
      </div>
    </div>
  )
}
