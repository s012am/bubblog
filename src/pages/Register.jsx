import { useState } from 'react'
import { Link } from 'react-router-dom'

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
  const [form, setForm] = useState({ username: '', email: '', password: '', passwordConfirm: '' })
  const [show, setShow] = useState({ password: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.username.trim()) next.username = 'Username is required.'
    else if (form.username.length < 2) next.username = 'Username must be at least 2 characters.'
    if (!form.email.trim()) next.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email format.'
    if (!form.password) next.password = 'Password is required.'
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.'
    if (!form.passwordConfirm) next.passwordConfirm = 'Please confirm your password.'
    else if (form.password !== form.passwordConfirm) next.passwordConfirm = 'Passwords do not match.'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = validate()
    if (Object.keys(next).length > 0) { setErrors(next); return }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setLoading(false)
    setDone(true)
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

  // 가입 완료 화면
  if (done) {
    return (
      <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-5">
        <div className="w-full max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)' }}
          >
            <svg className="w-6 h-6 text-gray-600" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 10l4.5 4.5L16 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">All done!</h2>
          <p className="text-sm text-gray-400 mb-7">
            <span className="font-semibold text-gray-600">{form.username}</span>, welcome!
            <br />Start writing your story.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full h-11 text-white text-sm font-semibold rounded-xl transition-all"
            style={{
              background: 'rgba(30,30,30,0.85)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          >
            Go to Sign in
          </Link>
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
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)' }}
            >
              <span className="text-gray-700 text-sm font-bold">B</span>
            </div>
            <span className="font-bold text-gray-800 text-xl tracking-tight">Bubblog</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Sign up</h1>
          <p className="text-sm text-gray-400 mt-1.5">Create an account and start writing</p>
        </div>

        {/* 카드 */}
        <div className="rounded-3xl p-7" style={glass}>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>

            {/* 사용자명 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Username</label>
              <GlassInput type="text" name="username" value={form.username} onChange={handleChange}
                placeholder="홍길동" autoComplete="nickname" error={!!errors.username} />
              <FieldError msg={errors.username} />
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Email</label>
              <GlassInput type="email" name="email" value={form.email} onChange={handleChange}
                placeholder="hello@example.com" autoComplete="email" error={!!errors.email} />
              <FieldError msg={errors.email} />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Password</label>
              <GlassInput type={show.password ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Min. 8 characters" autoComplete="new-password" error={!!errors.password}>
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
                  <p className="text-xs text-gray-400">{strengthLabel}</p>
                </div>
              )}
              <FieldError msg={errors.password} />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Confirm password</label>
              <GlassInput type={show.confirm ? 'text' : 'password'} name="passwordConfirm" value={form.passwordConfirm}
                onChange={handleChange} placeholder="Confirm password" autoComplete="new-password" error={!!errors.passwordConfirm}>
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
                  Signing up...
                </>
              ) : 'Sign up'}
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
            Continue with Google
          </button>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gray-700 hover:text-gray-500 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
