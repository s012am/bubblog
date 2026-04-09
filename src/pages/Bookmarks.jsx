import { useNavigate } from 'react-router-dom'
import { useBookmark } from '../context/BookmarkContext'
import { usePosts } from '../context/PostsContext'
import { SAMPLE_POSTS } from '../data/sampleUsers'
import PostCard from '../components/PostCard'

export default function Bookmarks() {
  const navigate = useNavigate()
  const { bookmarks } = useBookmark()
  const { posts } = usePosts()

  const allPosts = [...posts, ...SAMPLE_POSTS]
  const bookmarkedPosts = [...bookmarks]
    .reverse()
    .map((id) => allPosts.find((p) => p.id === id || p.id === Number(id)))
    .filter(Boolean)

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
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>저장된 글</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {bookmarkedPosts.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-20">저장된 글이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {bookmarkedPosts.map((post) => (
              <PostCard key={post.id} post={post} showMenu={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
