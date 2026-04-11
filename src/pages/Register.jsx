import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'

const glass = {
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(200,200,200,0.7)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.05)',
}

const glassInput = (focused, error) => ({
  background: focused ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: error
    ? '1.5px solid rgba(0,0,0,0.6)'
    : focused
    ? '1.5px solid rgba(255,255,255,0.95)'
    : '1.5px solid rgba(255,255,255,0.8)',
  boxShadow: focused ? '0 0 0 3px rgba(0,0,0,0.2)' : 'none',
  outline: 'none',
})

function GlassInput({ type, name, value, onChange, placeholder, autoComplete, error, children }) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      className="relative w-full h-11 rounded-xl overflow-hidden"
      style={glassInput(focused, error)}
    >
      <input
        type={type} name={name} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        className="w-full h-full bg-transparent pl-4 pr-10 text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
      />
      {children}
    </div>
  )
}

function FieldError({ msg }) {
  if (!msg) return null
  return (
    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="6" cy="6" r="5" /><path d="M6 4v2.5M6 8v.3" strokeLinecap="round" />
      </svg>
      {msg}
    </p>
  )
}

const EyeIcon = ({ crossed }) => crossed ? (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.8" /><path d="M2 2l12 12" strokeLinecap="round" />
  </svg>
) : (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" strokeLinecap="round" />
    <circle cx="8" cy="8" r="1.8" />
  </svg>
)

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ id: '', nickname: '', email: '', password: '', passwordConfirm: '' })
  const [show, setShow] = useState({ password: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [agree, setAgree] = useState({ privacy: false, terms: false, notify: false })

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.id.trim()) next.id = '아이디를 입력해주세요.'
    else if (form.id.length < 2) next.id = '아이디는 2자 이상이어야 합니다.'
    else if (!/^[a-zA-Z0-9_]+$/.test(form.id)) next.id = '영문, 숫자, 밑줄(_)만 사용할 수 있습니다.'
    if (!form.nickname.trim()) next.nickname = '닉네임을 입력해주세요.'
    else if (form.nickname.length < 2) next.nickname = '닉네임은 2자 이상이어야 합니다.'
    if (!form.email.trim()) next.email = '이메일을 입력해주세요.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = '이메일 형식이 올바르지 않습니다.'
    if (!form.password) next.password = '비밀번호를 입력해주세요.'
    else if (form.password.length < 8) next.password = '비밀번호는 8자 이상이어야 합니다.'
    if (!form.passwordConfirm) next.passwordConfirm = '비밀번호를 다시 입력해주세요.'
    else if (form.password !== form.passwordConfirm) next.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    if (!agree.privacy) next.privacy = '개인정보 처리방침에 동의해주세요.'
    if (!agree.terms) next.terms = '이용약관에 동의해주세요.'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = validate()
    if (Object.keys(next).length > 0) { setErrors(next); return }
    setLoading(true)
    const result = await register(form.id, form.nickname, form.email, form.password)
    setLoading(false)
    if (result.error) {
      setErrors({ email: result.error })
      return
    }
    setEmailSent(true)
  }

  const getStrength = (pw) => {
    if (!pw) return 0
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
  }
  const strength = getStrength(form.password)
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very strong'][strength]
  const strengthOpacity = ['', 0.3, 0.5, 0.75, 1][strength]

  if (emailSent) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="rounded-3xl p-8 flex flex-col items-center gap-5" style={glass}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.6)', border: '1.5px solid rgba(255,255,255,0.9)' }}>
              <svg className="w-7 h-7 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-800 mb-2">이메일을 확인해주세요</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="font-semibold text-gray-700">{form.email}</span>로<br/>인증 메일을 보냈어요.<br/>링크를 클릭하면 가입이 완료돼요.
              </p>
            </div>
            <p className="text-xs text-gray-400">메일이 없다면 스팸함도 확인해보세요.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full h-11 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background: 'rgba(40,40,40,0.82)', border: '1.5px solid rgba(255,255,255,0.18)', borderRadius: '14px' }}
            >
              로그인으로 이동
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" className="w-7 h-7">
              <circle cx="8" cy="15" r="5" strokeWidth={1.3} />
              <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="#6b7280" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
              <circle cx="18" cy="7" r="3" strokeWidth={1.2} />
              <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="#6b7280" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
              <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.1} />
              <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="#6b7280" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
            </svg>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">회원가입</h1>
        </div>

        {/* 카드 */}
        <div className="rounded-3xl p-7" style={glass}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* 아이디 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">아이디</label>
              <GlassInput type="text" name="id" value={form.id} onChange={handleChange}
                placeholder="영문, 숫자, 밑줄 사용 가능" autoComplete="username" error={!!errors.id} />
              <FieldError msg={errors.id} />
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">닉네임</label>
              <GlassInput type="text" name="nickname" value={form.nickname} onChange={handleChange}
                placeholder="표시될 이름" autoComplete="nickname" error={!!errors.nickname} />
              <FieldError msg={errors.nickname} />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">이메일</label>
              <GlassInput type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="hello@example.com" autoComplete="email" error={!!errors.email} />
              <FieldError msg={errors.email} />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">비밀번호</label>
              <GlassInput type={show.password ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="8자 이상 입력하세요" autoComplete="new-password" error={!!errors.password}>
                <button type="button" tabIndex={-1} onClick={() => setShow((v) => ({ ...v, password: !v.password }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <EyeIcon crossed={show.password} />
                </button>
              </GlassInput>

              {/* 강도 게이지 */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? `rgba(80,80,80,${strengthOpacity})` : 'rgba(255,255,255,0.6)' }} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{{ Weak: '약함', Fair: '보통', Strong: '강함', 'Very strong': '매우 강함' }[strengthLabel] || ''}</p>
                </div>
              )}
              <FieldError msg={errors.password} />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">비밀번호 확인</label>
              <GlassInput type={show.confirm ? 'text' : 'password'} name="passwordConfirm" value={form.passwordConfirm}
                onChange={handleChange} placeholder="비밀번호를 다시 입력하세요" autoComplete="new-password" error={!!errors.passwordConfirm}>
                {form.passwordConfirm && !errors.passwordConfirm && form.password === form.passwordConfirm ? (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 8.5l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : (
                  <button type="button" tabIndex={-1} onClick={() => setShow((v) => ({ ...v, confirm: !v.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    <EyeIcon crossed={show.confirm} />
                  </button>
                )}
              </GlassInput>
              <FieldError msg={errors.passwordConfirm} />
            </div>

            {/* 동의 항목 */}
            <div className="space-y-2 pt-1">
              {/* 전체 동의 */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree.privacy && agree.terms && agree.notify}
                  onChange={(e) => setAgree({ privacy: e.target.checked, terms: e.target.checked, notify: e.target.checked })}
                  className="w-4 h-4 rounded accent-gray-700 cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-700">전체 동의</span>
              </label>
              <div className="h-px" style={{ background: 'rgba(0,0,0,0.06)' }} />
              {/* 개인정보 */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={agree.privacy} onChange={(e) => setAgree(p => ({ ...p, privacy: e.target.checked }))}
                    className="w-4 h-4 rounded accent-gray-700 cursor-pointer" />
                  <span className="text-xs text-gray-600 flex-1">
                    <span className="text-gray-400 mr-1">[필수]</span>
                    개인정보 처리방침 동의
                  </span>
                  <Link to="/privacy" target="_blank" className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 flex-shrink-0">보기</Link>
                </label>
                <FieldError msg={errors.privacy} />
              </div>
              {/* 이용약관 */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" checked={agree.terms} onChange={(e) => setAgree(p => ({ ...p, terms: e.target.checked }))}
                    className="w-4 h-4 rounded accent-gray-700 cursor-pointer" />
                  <span className="text-xs text-gray-600 flex-1">
                    <span className="text-gray-400 mr-1">[필수]</span>
                    이용약관 동의
                  </span>
                  <Link to="/terms" target="_blank" className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 flex-shrink-0">보기</Link>
                </label>
                <FieldError msg={errors.terms} />
              </div>
              {/* 알림 */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={agree.notify} onChange={(e) => setAgree(p => ({ ...p, notify: e.target.checked }))}
                  className="w-4 h-4 rounded accent-gray-700 cursor-pointer" />
                <span className="text-xs text-gray-600">
                  <span className="text-gray-400 mr-1">[선택]</span>
                  마케팅 및 알림 수신 동의
                </span>
              </label>
            </div>

            {/* 버튼 */}
            <button
              type="submit" disabled={loading}
              className="w-full h-11 text-white text-sm font-semibold rounded-xl transition-all mt-1 flex items-center justify-center gap-2 hover:scale-[1.01]"
              style={{
                background: loading ? 'rgba(100,100,100,0.5)' : 'rgba(40,40,40,0.82)',
                backdropFilter: 'blur(10px)',
                border: '1.5px solid rgba(255,255,255,0.18)',
                borderRadius: '14px',
                boxShadow: [
                  '0 4px 16px rgba(0,0,0,0.18)',
                  '0 1px 4px rgba(0,0,0,0.1)',
                  'inset 0 1.5px 0 rgba(255,255,255,0.18)',
                  'inset 0 -1px 0 rgba(0,0,0,0.2)',
                ].join(', '),
              }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  가입 중...
                </>
              ) : '가입하기'}
            </button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.7)' }} />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.7)' }} />
          </div>

          {/* Google */}
          <button type="button"
            className="w-full h-11 text-sm font-medium text-gray-600 rounded-xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01]"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1.5px solid rgba(255,255,255,0.95)',
              borderRadius: '14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06), inset 0 1.5px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(0,0,0,0.03)',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
            </svg>
            Google로 계속하기
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold text-gray-700 hover:text-gray-500 transition-colors">로그인</Link>
        </p>
      </div>
    </div>
  )
}
