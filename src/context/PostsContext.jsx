import { createContext, useContext, useState, useEffect } from 'react'
import { POSTS as INITIAL_POSTS } from '../data/posts'
import { useProfile } from './ProfileContext'

const PostsContext = createContext(null)

const STORAGE_KEY = 'bubblog_posts'
const RECENT_KEY = 'bubblog_recent'
const MAX_RECENT = 20

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function filterExpired(posts) {
  const now = Date.now()
  return posts.filter((p) => !p.expiresAt || p.expiresAt > now)
}

function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? filterExpired(JSON.parse(saved)) : INITIAL_POSTS
  } catch {
    return INITIAL_POSTS
  }
}

export function PostsProvider({ children }) {
  const { profile } = useProfile()
  const [posts, setPosts] = useState(loadPosts)
  const [recentlyViewed, setRecentlyViewed] = useState(loadRecent)

  const addRecentlyViewed = (postId) => {
    setRecentlyViewed((prev) => {
      const next = [postId, ...prev.filter((id) => id !== postId)].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }

  // 만료된 Pop 글 자동 삭제
  const purgeExpired = () => {
    setPosts((prev) => {
      const next = filterExpired(prev)
      if (next.length !== prev.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      }
      return prev
    })
  }

  useEffect(() => {
    // 10초마다 체크
    const interval = setInterval(purgeExpired, 10 * 1000)

    // 탭/창 복귀 시 즉시 체크
    const onVisible = () => { if (document.visibilityState === 'visible') purgeExpired() }
    document.addEventListener('visibilitychange', onVisible)

    // 창 포커스 시 즉시 체크
    window.addEventListener('focus', purgeExpired)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', purgeExpired)
    }
  }, [])

  const addPost = (post) => {
    const newPost = {
      ...post,
      id: Date.now(),
      date: new Date().toISOString(),
      author: profile.name,
      readTime: Math.max(1, Math.ceil(post.content.length / 500)),
    }
    setPosts((prev) => {
      const next = [newPost, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return newPost
  }

  const updatePost = (id, changes) => {
    setPosts((prev) => {
      const next = prev.map((p) => p.id === id ? { ...p, ...changes } : p)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const deletePost = (id) => {
    setPosts((prev) => {
      const next = prev.filter((p) => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const incrementView = (postId) => {
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id !== postId ? p : { ...p, viewCount: (p.viewCount || 0) + 1 }
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const addComment = (postId, content) => {
    const comment = {
      id: Date.now(),
      author: profile.name,
      content,
      date: new Date().toISOString(),
    }
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id !== postId ? p : { ...p, comments: [...(p.comments || []), comment] }
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const deleteComment = (postId, commentId) => {
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id !== postId ? p : { ...p, comments: (p.comments || []).filter((c) => c.id !== commentId) }
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const deleteReply = (postId, commentId, replyId) => {
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id !== postId ? p : {
          ...p,
          comments: (p.comments || []).map((c) =>
            c.id !== commentId ? c : { ...c, replies: (c.replies || []).filter((r) => r.id !== replyId) }
          )
        }
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const toggleLike = (postId) => {
    const name = profile.name
    setPosts((prev) => {
      const next = prev.map((p) => {
        if (p.id !== postId) return p
        const likes = p.likes || []
        const already = likes.includes(name)
        return { ...p, likes: already ? likes.filter((n) => n !== name) : [...likes, name] }
      })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const isLiked = (postId) => {
    const p = posts.find((p) => p.id === postId)
    return p ? (p.likes || []).includes(profile.name) : false
  }

  const addReply = (postId, commentId, content) => {
    const reply = {
      id: Date.now(),
      author: profile.name,
      content,
      date: new Date().toISOString(),
    }
    setPosts((prev) => {
      const next = prev.map((p) =>
        p.id !== postId ? p : {
          ...p,
          comments: (p.comments || []).map((c) =>
            c.id !== commentId ? c : { ...c, replies: [...(c.replies || []), reply] }
          )
        }
      )
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <PostsContext.Provider value={{ posts, addPost, updatePost, deletePost, addComment, deleteComment, addReply, deleteReply, incrementView, toggleLike, isLiked, recentlyViewed, addRecentlyViewed }}>
      {children}
    </PostsContext.Provider>
  )
}

export function usePosts() {
  return useContext(PostsContext)
}
