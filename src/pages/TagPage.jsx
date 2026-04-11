import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { usePosts } from '../context/PostsContext'
import PostCard from '../components/PostCard'

export default function TagPage() {
  const { tag } = useParams()
  const navigate = useNavigate()
  const { posts } = usePosts()

  const taggedPosts = useMemo(() =>
    posts
      .filter((p) => p.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  , [posts, tag])

  return (
    <div className="min-h-screen">
      <div
        className="sticky top-0 z-30 px-5 pt-5 pb-4 flex items-center gap-3"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--divider)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 transition-colors"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-extrabold text-gray-400">#{tag}</h1>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 grid gap-4">
        {taggedPosts.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-16">태그된 글이 없습니다.</p>
        ) : (
          taggedPosts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}
