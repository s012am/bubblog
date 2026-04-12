import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function PasswordChange() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (newPw.length < 6) { setError('새 비밀번호는 6자 이상이어야 합니다.'); return }
    if (newPw !== confirmPw) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email,
      password: currentPw,
    })
    if (signInError) { setError('현재 비밀번호가 올바르지 않습니다.'); setLoading(false); return }
    const { error: updateError } = await supabase.auth.updateUser({ password: newPw })
    setLoading(false)
    if (updateError) { setError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.'); return }
    setDone(true)
    setTimeout(() => navigate(-1), 1500)
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
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>비밀번호 변경</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {done ? (
          <div className="flex flex-col items-center gap-3 pt-16">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" className="w-12 h-12">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm font-semibold text-gray-700">비밀번호가 변경되었습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden flex flex-col gap-0" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
              {[
                { label: '현재 비밀번호', value: currentPw, setter: setCurrentPw, placeholder: '현재 비밀번호 입력' },
                { label: '새 비밀번호', value: newPw, setter: setNewPw, placeholder: '6자 이상' },
                { label: '새 비밀번호 확인', value: confirmPw, setter: setConfirmPw, placeholder: '새 비밀번호 재입력' },
              ].map(({ label, value, setter, placeholder }, i) => (
                <div key={label}>
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-gray-400 mb-2">{label}</p>
                    <input
                      type="password"
                      value={value}
                      onChange={(e) => { setter(e.target.value); setError('') }}
                      placeholder={placeholder}
                      className="w-full text-sm text-gray-700 placeholder-gray-300 bg-transparent focus:outline-none"
                    />
                  </div>
                  {i < 2 && <div className="h-px bg-gray-100 mx-5" />}
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-400 px-1">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading || !currentPw || !newPw || !confirmPw}
              className="w-full h-12 rounded-2xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
              style={{ background: 'rgba(30,30,30,0.85)' }}
            >
              {loading ? '변경 중...' : '변경하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
