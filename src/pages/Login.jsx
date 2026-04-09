import { useState } from 'react'
import { Link } from 'react-router-dom'

const glass = {
  background: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(200,200,200,0.7)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.05)',
}

const glassInput = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1.5px solid rgba(255,255,255,0.8)',
  outline: 'none',
}

const glassInputFocus = {
  background: 'rgba(255,255,255,0.8)',
  border: '1.5px solid rgba(255,255,255,0.95)',
  boxShadow: '0 0 0 3px rgba(0,0,0,0.2)',
}

function GlassInput({ type, name, value, onChange, placeholder, autoComplete, children, error }) {
  const [focused, setFocused] = useState(false)
  return (
    <div
      className="relative w-full h-11 rounded-xl overflow-hidden"
      style={focused ? { ...glassInput, ...glassInputFocus } : error ? { ...glassInput, border: '1.5px solid rgba(0,0,0,0.6)' } : glassInput}
    >
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full h-full bg-transparent pl-4 pr-10 text-sm text-gray-800 placeholder-gray-300 focus:outline-none"
      />
      {children}
    </div>
  )
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setError('Invalid email or password.')
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">

        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1.5px solid rgba(255,255,255,0.9)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,1)',
              }}
            >
              <span className="text-gray-700 text-sm font-bold">B</span>
            </div>
            <span className="font-bold text-gray-800 text-xl tracking-tight">Bubblog</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Sign in</h1>
        </div>

        {/* 카드 */}
        <div className="rounded-3xl p-7" style={glass}>

          {/* 에러 */}
          {error && (
            <div
              className="flex items-start gap-2.5 rounded-2xl px-4 py-3 mb-5"
              style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(200,180,240,0.4)' }}
            >
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3.5M8 10.5v.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-gray-600 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase">Email</label>
              <GlassInput
                type="email" name="email" value={form.email}
                onChange={handleChange} placeholder="hello@example.com"
                autoComplete="email" error={!!error}
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 tracking-wide uppercase">Password</label>
                <Link to="/forgot-password" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Forgot password</Link>
              </div>
              <GlassInput
                type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                onChange={handleChange} placeholder="Enter password"
                autoComplete="current-password" error={!!error}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" strokeLinecap="round" />
                      <circle cx="8" cy="8" r="1.8" /><path d="M2 2l12 12" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 8s2.5-4.5 6-4.5S14 8 14 8s-2.5 4.5-6 4.5S2 8 2 8z" strokeLinecap="round" />
                      <circle cx="8" cy="8" r="1.8" />
                    </svg>
                  )}
                </button>
              </GlassInput>
            </div>

            {/* 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-white text-sm font-semibold rounded-xl transition-all mt-1 flex items-center justify-center gap-2"
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
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.7)' }} />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.7)' }} />
          </div>

          {/* Google */}
          <button
            type="button"
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
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-gray-700 hover:text-gray-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
