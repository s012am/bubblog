import { useLocation, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const isPost = pathname.startsWith('/post/')

  if (!isPost) return null

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--nav-border)',
        boxShadow: 'var(--nav-shadow-bottom)',
      }}
    >
      <div className="max-w-3xl mx-auto px-5 h-14 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M10 12L6 8l4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}
