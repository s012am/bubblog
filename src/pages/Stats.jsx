import { useNavigate, Link } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'

export default function Stats() {
  const navigate = useNavigate()
  const { posts } = usePosts()

  const logCount = posts.filter((p) => p.type === 'log' || !p.type).length
  const popCount = posts.filter((p) => p.type === 'pop').length

  const totalRebubbles = posts.reduce((s, p) => s + (p.rebubbles?.length ?? 0), 0)

  const totalViews = posts.reduce((s, p) => s + (p.viewCount || 0), 0)

  const mostRebubbled = posts.length === 0 ? null : posts.reduce((best, p) =>
    (p.rebubbles?.length ?? 0) > (best.rebubbles?.length ?? 0) ? p : best
  , posts[0])

  const mostRebubbledCount = mostRebubbled ? (mostRebubbled.rebubbles?.length ?? 0) : 0

  const statItems = [
    { label: 'Log', value: logCount, sub: '글' },
    { label: 'Pop', value: popCount, sub: '글' },
    { label: 'View', value: totalViews, sub: '회' },
    { label: 'Rebubble', value: totalRebubbles, sub: '회' },
  ]

  return (
    <div className="min-h-screen">
      <div
        className="flex items-center gap-3 px-4 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>내 글 통계</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">

        {posts.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-20">아직 작성한 글이 없습니다.</p>
        ) : (
          <>
            {/* 총 게시글 */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">총 게시글</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-gray-800">{posts.length}</span>
                <span className="text-sm text-gray-400 mb-1.5">개</span>
              </div>
            </div>

            {/* 세부 통계 */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">세부 현황</p>
              <div className="grid grid-cols-2 gap-3">
                {statItems.map((item) => (
                  <div key={item.label} className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-50">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-gray-700">{item.value}</span>
                      <span className="text-xs text-gray-400">{item.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 가장 인기 있는 글 */}
            {mostRebubbledCount > 0 && (
              <div
                className="rounded-2xl p-5"
                style={{ background: 'var(--card-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
              >
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">리버블 많은 글</p>
                <Link to={`/post/${mostRebubbled.id}`} className="flex flex-col gap-1 group">
                  <p className="text-sm font-semibold text-gray-700 group-hover:text-gray-500 transition-colors line-clamp-2 leading-snug">
                    {mostRebubbled.title}
                  </p>
                  <p className="text-xs text-gray-400">리버블 {mostRebubbledCount}회</p>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
