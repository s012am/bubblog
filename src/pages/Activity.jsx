import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import PostCard from '../components/PostCard'

const tabs = ['최근 본 글', '좋아요한 글']

export default function Activity() {
  const navigate = useNavigate()
  const { posts, recentlyViewed, isLiked } = usePosts()
  const [tab, setTab] = useState(0)

  const recentPosts = recentlyViewed
    .map((id) => posts.find((p) => String(p.id) === String(id)))
    .filter(Boolean)

  const likedPosts = posts.filter((p) => isLiked(p.id))

  const list = tab === 0 ? recentPosts : likedPosts
  const emptyMsg = tab === 0 ? '최근 본 글이 없어요.' : '좋아요한 글이 없어요.'

  return (
    <div className="min-h-screen">
      <div
        className="flex items-center gap-3 px-4 pt-8 pb-4"
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
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>내 활동</h1>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{
              background: tab === i ? 'rgba(55,65,81,0.88)' : 'var(--input-bg)',
              color: tab === i ? 'white' : '#9ca3af',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {list.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-20">{emptyMsg}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {list.map((post) => (
              <PostCard key={post.id} post={post} showMenu={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
