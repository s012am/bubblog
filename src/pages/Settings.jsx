import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme, THEMES } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const navigate = useNavigate()
  const { themeId, setThemeId } = useTheme()
  const { logout, session } = useAuth()
  const { prefs, updatePref } = useNotification()
  const [showNotifSheet, setShowNotifSheet] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showPwSheet, setShowPwSheet] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwDone, setPwDone] = useState(false)

  const handleChangePassword = async () => {
    setPwError('')
    if (newPw.length < 6) { setPwError('새 비밀번호는 6자 이상이어야 합니다.'); return }
    if (newPw !== confirmPw) { setPwError('새 비밀번호가 일치하지 않습니다.'); return }
    setPwLoading(true)
    // 현재 비밀번호 확인
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session?.user?.email,
      password: currentPw,
    })
    if (signInError) { setPwError('현재 비밀번호가 올바르지 않습니다.'); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwLoading(false)
    if (error) { setPwError('비밀번호 변경에 실패했습니다. 다시 시도해주세요.'); return }
    setPwDone(true)
    setTimeout(() => { setShowPwSheet(false); setPwDone(false); setCurrentPw(''); setNewPw(''); setConfirmPw('') }, 1500)
  }

  const closePwSheet = () => { setShowPwSheet(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); setPwDone(false) }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    const { error } = await supabase.rpc('delete_my_account')
    if (error) {
      setDeleting(false)
      setDeleteConfirm(false)
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
          <div>
            <div className="w-full flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-gray-700">이메일</span>
              <span className="text-xs text-gray-400">{session?.user?.email || ''}</span>
            </div>
            <div className="h-px bg-gray-100 mx-5" />
            <button onClick={() => setShowPwSheet(true)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <span className="text-sm text-gray-700">비밀번호 변경</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 text-gray-300">
                <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="pb-1" />
        </div>

        {/* 앱 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-5 pt-4 pb-2">앱</p>
          {[
            { label: '알림 설정', sub: '', onPress: () => setShowNotifSheet(true) },
            { label: '개인정보 처리방침', sub: '', to: '/privacy' },
            { label: '이용약관', sub: '', to: '/terms' },
            { label: '오픈소스 라이선스', sub: '', to: '/opensource' },
            { label: '앱 버전', sub: '0.1.0' },
          ].map((item, i, arr) => (
            <div key={item.label}>
              <button onClick={() => item.onPress ? item.onPress() : item.to && navigate(item.to)} className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-gray-50 transition-colors">
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

        {/* 로그아웃 / 탈퇴 */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <button
            className="w-full flex items-center px-5 py-3.5 text-left hover:bg-red-50 transition-colors"
            onClick={async () => { await logout(); navigate('/login') }}
          >
            <span className="text-sm text-red-400">로그아웃</span>
          </button>
          <div className="h-px bg-gray-100 mx-5" />
          <button
            className="w-full flex items-center px-5 py-3.5 text-left hover:bg-red-50 transition-colors"
            onClick={() => setDeleteConfirm(true)}
          >
            <span className="text-sm text-red-400">계정 탈퇴</span>
          </button>
        </div>

      </div>

      {/* 알림 설정 시트 */}
      {showNotifSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setShowNotifSheet(false)}>
          <div className="w-full max-w-lg rounded-t-3xl px-5 pt-5 pb-10 flex flex-col gap-1" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold text-gray-800">알림 설정</p>
              <button onClick={() => setShowNotifSheet(false)} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400" style={{ background: 'var(--input-bg)' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {[
              { key: 'like',     label: '좋아요',  desc: '내 글에 좋아요가 달릴 때' },
              { key: 'rebubble', label: '리버블',  desc: '내 글이 리버블될 때' },
              { key: 'follow',   label: '팔로우',  desc: '누군가 나를 팔로우할 때' },
              { key: 'comment',  label: '댓글',    desc: '내 글에 댓글이 달릴 때' },
              { key: 'reply',    label: '답글',    desc: '내 댓글에 답글이 달릴 때' },
            ].map(({ key, label, desc }, i, arr) => (
              <div key={key}>
                <div className="flex items-center justify-between py-3.5 px-1">
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
                {i < arr.length - 1 && <div className="h-px bg-gray-100" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 비밀번호 변경 바텀시트 */}
      {showPwSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={closePwSheet}>
          <div className="w-full max-w-sm rounded-3xl px-6 pt-6 pb-8 flex flex-col gap-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-800">비밀번호 변경</p>
              <button onClick={closePwSheet} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400" style={{ background: 'var(--input-bg)' }}>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            {pwDone ? (
              <div className="py-6 flex flex-col items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" className="w-10 h-10">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm font-semibold text-gray-700">비밀번호가 변경되었습니다</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {[
                    { label: '현재 비밀번호', value: currentPw, setter: setCurrentPw, placeholder: '현재 비밀번호 입력' },
                    { label: '새 비밀번호', value: newPw, setter: setNewPw, placeholder: '6자 이상' },
                    { label: '새 비밀번호 확인', value: confirmPw, setter: setConfirmPw, placeholder: '새 비밀번호 재입력' },
                  ].map(({ label, value, setter, placeholder }) => (
                    <div key={label} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-400">{label}</label>
                      <input
                        type="password"
                        value={value}
                        onChange={(e) => { setter(e.target.value); setPwError('') }}
                        placeholder={placeholder}
                        className="w-full h-11 rounded-xl px-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none"
                        style={{ background: 'var(--input-bg)', border: '1px solid var(--divider)' }}
                      />
                    </div>
                  ))}
                  {pwError && <p className="text-xs text-red-400">{pwError}</p>}
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={pwLoading || !currentPw || !newPw || !confirmPw}
                  className="h-12 rounded-2xl text-sm font-semibold text-white transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(30,30,30,0.85)' }}
                >
                  {pwLoading ? '변경 중...' : '변경하기'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 탈퇴 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-24" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <div className="flex flex-col gap-1">
              <p className="text-base font-bold text-gray-800">정말 탈퇴하시겠어요?</p>
              <p className="text-sm text-gray-400 leading-relaxed">작성한 글, 팔로우 정보 등 모든 데이터가 삭제되며 복구할 수 없습니다.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-gray-500 transition-colors"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--divider)' }}
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white transition-colors"
                style={{ background: deleting ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.85)' }}
              >
                {deleting ? '탈퇴 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
