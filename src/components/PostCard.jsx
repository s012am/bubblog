import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useBookmark } from '../context/BookmarkContext'
import SourceCard from './SourceCard'

const cardStyle = {
  background: 'var(--card-bg-solid)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--card-border-soft)',
  borderRadius: '22px',
  boxShadow: 'var(--card-shadow)',
}

const cardHover = {
  ...cardStyle,
  boxShadow: 'var(--card-shadow-hover)',
}

function formatRemaining(expiresAt) {
  const ms = expiresAt - Date.now()
  if (ms <= 0) return '만료'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}초 후 삭제`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}분 후 삭제`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 후 삭제`
  return `${Math.floor(h / 24)}일 후 삭제`
}

export default function PostCard({ post, showMenu = false }) {
  const navigate = useNavigate()
  const { deletePost, isLiked, isRebubbled, currentUserId } = usePosts()
  const { toggleBookmark, isBookmarked } = useBookmark()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  const isOwn = !!currentUserId && post.authorId === currentUserId

  useEffect(() => {
    if (!reportDone) return
    const t = setTimeout(() => setReportDone(false), 2500)
    return () => clearTimeout(t)
  }, [reportDone])

  const d = new Date(post.date)
  const formattedDate = `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}`

  return (
    <>
      <article
        className="group transition-all duration-200 hover:-translate-y-1 relative"
        style={{ ...cardStyle, zIndex: menuOpen ? 10 : 'auto' }}
        onMouseEnter={e => Object.assign(e.currentTarget.style, { ...cardHover, zIndex: menuOpen ? 10 : 'auto' })}
        onMouseLeave={e => Object.assign(e.currentTarget.style, { ...cardStyle, zIndex: menuOpen ? 10 : 'auto' })}
      >
        {/* 반사광 */}
        <div className="absolute pointer-events-none" style={{ top: '-10%', left: '-5%', width: '55%', height: '45%', borderRadius: '50%', background: document.documentElement.hasAttribute('data-dark') ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.45)', filter: 'blur(16px)' }} />

        <Link to={`/post/${post.id}`} className="block p-5 relative z-10">
          {post.tags?.length > 0 && (
            <p className="text-xs text-gray-400 mb-2">
              {post.tags.map((tag, i) => (
                <span key={tag}>
                  {i > 0 && ' · '}
                  <Link
                    to={`/tag/${tag}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-gray-600 transition-colors"
                  >
                    {tag}
                  </Link>
                </span>
              ))}
            </p>
          )}
          <h2 className="text-base font-bold text-gray-800 mb-2 leading-snug pr-8">
            {post.title}
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-3">
            {post.excerpt}
          </p>
          {post.source && (
            <div className="mb-2">
              <SourceCard source={post.source} compact />
            </div>
          )}
          <div className="flex items-center justify-between mt-3">
            {/* 날짜 + Log/Pop */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{formattedDate}</span>
              <span className="text-xs font-normal tracking-widest uppercase" style={{ color: '#9ca3af' }}>
                {post.type === 'pop' ? 'Pop' : 'Log'}
              </span>
              {post.type === 'pop' && post.expiresAt && (
                <span className="text-xs text-gray-400">{formatRemaining(post.expiresAt)}</span>
              )}
            </div>
            {/* 액션 카운트 */}
            <div className="flex items-center gap-3">
              {/* 좋아요 */}
              <div className="flex items-center gap-1" style={{ color: isLiked(post.id) ? '#ef4444' : '#9ca3af' }}>
                <svg viewBox="0 0 24 24" fill={isLiked(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                  <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs">{post.likes?.length || 0}</span>
              </div>
              {/* 리버블 */}
              <div className="flex items-center gap-1" style={{ color: isRebubbled(post.id) ? '#3b82f6' : '#9ca3af' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5">
                  <circle cx="8" cy="15" r="5" strokeWidth={1.3} />
                  <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
                  <circle cx="18" cy="7" r="3" strokeWidth={1.2} />
                  <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
                  <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.1} />
                  <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="currentColor" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
                </svg>
                <span className="text-xs">{post.rebubbles?.length || 0}</span>
              </div>
              {/* 댓글 */}
              <div className="flex items-center gap-1 text-gray-400">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs">{(post.comments || []).reduce((s, c) => s + 1 + (c.replies?.length || 0), 0)}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* 점 세 개 메뉴 */}
        {showMenu && (
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={(e) => { e.preventDefault(); setMenuOpen((v) => !v); setConfirmDelete(false) }}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
              </svg>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-50 w-28 rounded-xl overflow-hidden" style={{ background: 'var(--dropdown-bg)', backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid var(--divider)' }}>
                {isOwn && (
                  <>
                    <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); navigate(`/write/edit/${post.id}`) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400"><path d="M11 1h4v4M15 1l-6 6M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      수정
                    </button>
                    <div className="h-px bg-gray-100" />
                  </>
                )}
                <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); const url = `${window.location.origin}/post/${post.id}`; if (navigator.share) navigator.share({ title: post.title, url }); else navigator.clipboard.writeText(url) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400"><circle cx="12" cy="3" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="13" r="1.8"/><path d="M5.8 9l4.4 2.5M10.2 4.5L5.8 7" strokeLinecap="round"/></svg>
                  공유
                </button>
                <div className="h-px bg-gray-100" />
                {isOwn ? (
                  <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); setConfirmDelete(true) }} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2.5">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5"><path d="M2 4h12M5 4V2h6v2M13 4l-.8 9.5a1 1 0 0 1-1 .9H4.8a1 1 0 0 1-1-.9L3 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    삭제
                  </button>
                ) : (
                  <>
                    <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); toggleBookmark(post.id) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5">
                      <svg viewBox="0 0 16 16" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400">
                        <path d="M3 2h10v13l-5-3-5 3V2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {isBookmarked(post.id) ? '저장됨' : '저장'}
                    </button>
                    <div className="h-px bg-gray-100" />
                    <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); setReportDone(true) }} className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2.5">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5"><path d="M8 1.5L1.5 13h13L8 1.5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v3.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none"/></svg>
                      신고
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </article>

      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
      )}

      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(false)}>
          <div className="w-72 rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--dialog-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 text-center">삭제하시겠습니까?</p>
            <p className="text-xs text-gray-400 text-center -mt-2">삭제된 글은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" style={{ border: '1px solid var(--divider)' }}>취소</button>
              <button onClick={() => { deletePost(post.id); setConfirmDelete(false) }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* 신고 완료 토스트 */}
      {reportDone && (
        <div
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
          style={{ background: 'rgba(55,65,81,0.92)', backdropFilter: 'blur(8px)', whiteSpace: 'nowrap' }}
        >
          신고가 접수되었습니다.
        </div>
      )}
    </>
  )
}
