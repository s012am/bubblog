import { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { haptic } from '../lib/haptic'
import { useProfile } from '../context/ProfileContext'
import { useFollow } from '../context/FollowContext'
import { supabase } from '../lib/supabase'

function highlightText(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-gray-200 text-gray-800 rounded" style={{ padding: '0' }}>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
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

function DiscoverPostCard({ post }) {
  const { isRebubbled, isLiked } = usePosts()
  const d = new Date(post.date)
  const formattedDate = `${d.getFullYear()} · ${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}`
  const authorName = post.author
  const authorAvatar = post.authorAvatar
  return (
    <Link
      to={`/post/${post.id}`}
      className="block p-4 rounded-2xl transition-all hover:-translate-y-0.5"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)' }}
    >
      {/* 상단: 프로필 + 태그 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
            {authorAvatar
              ? <img src={authorAvatar} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-gray-500 font-semibold" style={{ fontSize: '8px' }}>{(authorName || '?')[0].toUpperCase()}</span>}
          </div>
          <span className="text-xs font-semibold text-gray-500">{authorName}</span>
        </div>
        {post.tags?.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {post.tags.slice(0, 2).map((t) => (
              <Link key={t} to={`/tag/${t}`} onClick={(e) => e.stopPropagation()}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </div>
      <p className="text-sm font-bold text-gray-800 leading-snug mb-1">{post.title}</p>
      {post.excerpt && (
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-3">{post.excerpt}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{formattedDate}</span>
            <span className="text-xs font-normal tracking-widest uppercase" style={{ color: '#9ca3af' }}>
              {post.type === 'pop' ? 'Pop' : 'Log'}
            </span>
            {post.type === 'pop' && post.expiresAt && (
              <span className="text-xs text-gray-400">{formatRemaining(post.expiresAt)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1" style={{ color: isLiked(post.id) ? '#ef4444' : '#9ca3af' }}>
            <svg viewBox="0 0 24 24" fill={isLiked(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
              <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs">{post.likes?.length || 0}</span>
          </div>
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
          <div className="flex items-center gap-1 text-gray-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs">{(post.comments || []).reduce((s, c) => s + 1 + (c.replies?.length || 0), 0)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function Explore() {
  const { posts, currentUserId } = usePosts()
  const { profile } = useProfile()
  const { isFollowing, follow, unfollow } = useFollow()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [focused, setFocused] = useState(false)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bubblog_search_history') || '[]') } catch { return [] }
  })
  const [searchedUsers, setSearchedUsers] = useState([])
  const [userSearching, setUserSearching] = useState(false)

  const addToHistory = (term) => {
    if (!term.trim()) return
    setHistory((prev) => {
      const next = [term.trim(), ...prev.filter((h) => h !== term.trim())].slice(0, 8)
      localStorage.setItem('bubblog_search_history', JSON.stringify(next))
      return next
    })
  }

  const removeFromHistory = (term) => {
    setHistory((prev) => {
      const next = prev.filter((h) => h !== term)
      localStorage.setItem('bubblog_search_history', JSON.stringify(next))
      return next
    })
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('bubblog_search_history')
  }

  const q = query.trim().toLowerCase()

  // 닉네임/아이디로 유저 검색 (디바운스 300ms)
  useEffect(() => {
    if (!q) { setSearchedUsers([]); return }
    setUserSearching(true)
    const timer = setTimeout(async () => {
      const escaped = q.replace(/%/g, '\\%').replace(/_/g, '\\_')
      const { data } = await supabase
        .from('profiles')
        .select('id, username, nickname, bio, avatar_url')
        .or(`username.ilike.%${escaped}%,nickname.ilike.%${escaped}%`)
        .limit(15)
      setSearchedUsers(data || [])
      setUserSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [q])

  const matchedPosts = useMemo(() => {
    if (!q) return []
    return posts.filter((p) =>
      p.title?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.toLowerCase().includes(q)) ||
      p.author?.toLowerCase().includes(q)
    )
  }, [posts, q])

  const matchedTags = useMemo(() => {
    if (!q) return []
    const tagSet = new Set()
    posts.forEach((p) => {
      p.tags?.forEach((t) => {
        if (t.toLowerCase().includes(q)) tagSet.add(t)
      })
    })
    return [...tagSet]
  }, [posts, q])

  const [shuffleSeed] = useState(Math.random)

  // 탐색 화면용 데이터
  const popularTags = useMemo(() => {
    const counts = {}
    posts.forEach((p) => p.tags?.forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)
  }, [posts])

  const recommendedPosts = useMemo(() => {
    const now = Date.now()
    const top20 = [...posts]
      .map((p) => {
        const ageDays = (now - new Date(p.date).getTime()) / (1000 * 60 * 60 * 24)
        const recency = Math.max(0, 10 - ageDays * 0.3)
        const comments = (p.comments?.length ?? 0) * 3
        const tags = (p.tags?.length ?? 0) * 1
        const rebubbles = (p.rebubbles?.length ?? 0) * 4
        return { ...p, _score: recency + comments + tags + rebubbles }
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 20)
    let s = shuffleSeed
    const result = [...top20]
    for (let i = result.length - 1; i > 0; i--) {
      s = (s * 9301 + 49297) % 233280
      const j = Math.floor((s / 233280) * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result.slice(0, 10)
  }, [posts, shuffleSeed])

  const shownPosts = activeTab === 'people' || activeTab === 'tags' ? [] : matchedPosts
  const shownPeople = activeTab === 'posts' || activeTab === 'tags' ? [] : searchedUsers
  const shownTags = activeTab === 'posts' || activeTab === 'people' ? [] : matchedTags
  const tagFilteredPosts = useMemo(() =>
    activeTab === 'tags' && q
      ? posts.filter((p) => p.tags?.some((t) => t.toLowerCase().includes(q)))
      : []
  , [activeTab, posts, q])

  return (
    <div className="min-h-screen">
      {/* 검색 헤더 */}
      <div
        className="sticky top-0 z-30 px-5 pt-5 pb-3 relative"
        style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--divider)' }}
      >
        <div
          className="flex items-center gap-2 px-4 rounded-2xl"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--divider)' }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-gray-400 flex-shrink-0">
            <circle cx="9" cy="9" r="6" />
            <path d="M17 17l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && q) addToHistory(q) }}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            placeholder="글 또는 사람 검색..."
            className="flex-1 py-3 text-sm text-gray-700 placeholder-gray-400 bg-transparent outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500 transition-colors">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        {/* 필터 탭 */}
        {q && (
          <div className="flex mt-3 gap-1">
            {[{ id: 'all', label: '전체' }, { id: 'posts', label: '글' }, { id: 'people', label: '사람' }, { id: 'tags', label: '태그' }].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? 'rgba(30,30,30,0.85)' : 'rgba(0,0,0,0.04)',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* 최근 검색어 드롭다운 */}
        {!q && focused && history.length > 0 && (
          <div
            className="absolute left-0 right-0 px-5 py-3 z-40"
            style={{ top: '100%', background: 'var(--nav-bg)', backdropFilter: 'blur(16px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', borderBottom: '1px solid var(--divider)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">최근 검색어</span>
              <button onClick={clearHistory} className="text-xs text-gray-300 hover:text-gray-500 transition-colors">전체 삭제</button>
            </div>
            {history.map((term) => (
              <div
                key={term}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
                onClick={() => { setQuery(term); setFocused(false) }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-300 flex-shrink-0">
                  <circle cx="7" cy="7" r="4.5" /><path d="M13 13l-2.5-2.5" strokeLinecap="round" />
                </svg>
                <span className="flex-1 text-sm text-gray-600">{term}</span>
                <button onClick={(e) => { e.stopPropagation(); removeFromHistory(term) }} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-6">

        {/* 탐색 화면 (검색 전) */}
        {!q && !focused && (
          <div className="space-y-8">
            {/* 인기 태그 */}
            {popularTags.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">인기 태그</h2>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/tag/${tag}`}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-700 transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'var(--input-bg)' }}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* 추천 글 */}
            <section>
              <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">추천 글</h2>
              <div className="flex flex-col gap-2">
                {recommendedPosts.length === 0
                  ? <p className="text-sm text-gray-300 text-center py-4">글이 없습니다.</p>
                  : recommendedPosts.map((post) => (
                    <DiscoverPostCard key={post.id} post={post} />
                  ))}
              </div>
            </section>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {q && !userSearching && shownPosts.length === 0 && shownPeople.length === 0 && shownTags.length === 0 && tagFilteredPosts.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-16 gap-2">
            <p className="text-sm text-gray-400">
              <span className="font-semibold text-gray-600">"{query}"</span> 에 대한 결과가 없습니다.
            </p>
            <p className="text-xs text-gray-300">다른 키워드로 검색해 보세요.</p>
          </div>
        )}

        {/* 태그 결과 */}
        {activeTab === 'tags' && shownTags.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">태그</h2>
            <div className="flex flex-wrap gap-2 mb-5">
              {shownTags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full text-xs font-semibold text-gray-700"
                  style={{ background: 'var(--input-bg)' }}
                >
                  {highlightText(tag, query)}
                </span>
              ))}
            </div>
            {tagFilteredPosts.length > 0 && (
              <>
                <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">관련 글</h2>
                <div className="flex flex-col gap-2">
                  {tagFilteredPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/post/${post.id}`}
                      className="block p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)' }}
                    >
                      {post.tags?.length > 0 && (
                        <p className="text-xs text-gray-400 mb-1">
                          {post.tags.map((t, i) => <span key={t}>{i > 0 && ' · '}{highlightText(t, query)}</span>)}
                        </p>
                      )}
                      <p className="text-sm font-bold text-gray-800 leading-snug mb-1">{post.title}</p>
                      {post.excerpt && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                          {post.authorAvatar
                            ? <img src={post.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                            : <span className="text-gray-500 font-semibold" style={{ fontSize: '8px' }}>{(post.author || '?')[0].toUpperCase()}</span>}
                        </div>
                        <span className="text-xs text-gray-400">{post.author}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* 사람 결과 */}
        {shownPeople.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">사람</h2>
            <div className="flex flex-col gap-2">
              {shownPeople.map((user) => {
                const displayName = user.nickname || user.username
                const postCount = posts.filter(p => p.authorId === user.id).length
                const isMe = user.id === currentUserId
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)' }}
                  >
                    <Link to={`/user/${user.username}`} className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                      {user.avatar_url
                        ? <img src={user.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                        : <span className="text-sm font-bold text-gray-500">{displayName[0]?.toUpperCase()}</span>}
                    </Link>
                    <Link to={`/user/${user.username}`} className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-sm font-bold text-gray-800">{highlightText(displayName, query)}</p>
                        <p className="text-xs text-gray-400">@{highlightText(user.username, query)}</p>
                      </div>
                      {user.bio && <p className="text-xs text-gray-400 mt-0.5 truncate">{user.bio}</p>}
                      <p className="text-xs text-gray-300 mt-0.5">글 {postCount}개</p>
                    </Link>
                    {!isMe && (
                      <button
                        onClick={() => { haptic(15); isFollowing(user.username) ? unfollow(user.username) : follow(user.username) }}
                        className="px-3 py-1 rounded-full text-xs font-semibold transition-all flex-shrink-0"
                        style={{
                          background: isFollowing(user.username) ? 'var(--input-bg)' : 'rgba(30,30,30,0.85)',
                          color: isFollowing(user.username) ? '#6b7280' : 'white',
                          border: isFollowing(user.username) ? '1px solid var(--divider)' : 'none',
                        }}
                      >
                        {isFollowing(user.username) ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* 글 결과 */}
        {shownPosts.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-3">글</h2>
            <div className="flex flex-col gap-2">
              {shownPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/post/${post.id}`}
                  className="block p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--divider)', boxShadow: 'var(--card-shadow)' }}
                >
                  {post.tags?.length > 0 && (
                    <p className="text-xs text-gray-400 mb-1">
                      {post.tags.map((t, i) => <span key={t}>{i > 0 && ' · '}{highlightText(t, query)}</span>)}
                    </p>
                  )}
                  <p className="text-sm font-bold text-gray-800 leading-snug mb-1">
                    {highlightText(post.title, query)}
                  </p>
                  {post.excerpt && (
                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {highlightText(post.excerpt, query)}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--avatar-bg)' }}>
                      {post.authorAvatar
                        ? <img src={post.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                        : <span className="text-gray-500 font-semibold" style={{ fontSize: '8px' }}>{(post.author || '?')[0].toUpperCase()}</span>}
                    </div>
                    <span className="text-xs text-gray-400">{highlightText(post.author || '', query)}</span>
                    <span className="text-xs text-gray-300">·</span>
                    <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
