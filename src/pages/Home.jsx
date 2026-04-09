import { Link } from 'react-router-dom'
import { POSTS } from '../data/posts'

const bubbleCard = {
  background: 'var(--card-bg-light)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid var(--card-border-soft)',
  borderRadius: '22px',
  boxShadow: 'var(--card-shadow)',
}

const bubbleCardHover = {
  ...bubbleCard,
  boxShadow: 'var(--card-shadow-hover)',
}

function TagBadge({ tag }) {
  return (
    <span
      className="inline-block px-2.5 py-0.5 text-xs font-medium text-gray-500 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.5)',
        border: '1px solid rgba(255,255,255,0.6)',
      }}
    >
      {tag}
    </span>
  )
}

function PostCard({ post }) {
  const d = new Date(post.date)
  const formattedDate = `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}`

  return (
    <article
      className="group transition-all duration-200 hover:-translate-y-1"
      style={bubbleCard}
      onMouseEnter={e => Object.assign(e.currentTarget.style, bubbleCardHover)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, bubbleCard)}
    >
      <Link to={`/post/${post.id}`} className="block p-6">
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}

        <h2 className="text-base font-bold text-gray-800 mb-2 leading-snug group-hover:text-gray-500 transition-colors">
          {post.title}
        </h2>

        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid rgba(255,255,255,0.6)',
              }}
            >
              <span className="text-gray-500 font-semibold" style={{ fontSize: '9px' }}>
                {post.author[0].toUpperCase()}
              </span>
            </div>
            <span className="font-medium text-gray-500">{post.author}</span>
          </div>
          <span>{formattedDate}</span>
        </div>
      </Link>
    </article>
  )
}

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-5 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight mb-1.5">
          Drift
        </h1>
        <p className="text-gray-400 text-sm"></p>
      </div>

      <div className="grid gap-4">
        {POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
