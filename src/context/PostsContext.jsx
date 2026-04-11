import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const PostsContext = createContext(null)

const RECENT_KEY = 'bubblog_recent'
const MAX_RECENT = 20

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]') } catch { return [] }
}

function mapPost(raw) {
  const flatComments = (raw.comments || []).map(c => ({
    id: c.id,
    author: c.profiles?.nickname || c.profiles?.username || '',
    authorUsername: c.profiles?.username || '',
    authorId: c.author_id,
    content: c.content,
    date: c.created_at,
    parentId: c.parent_id || null,
    replies: [],
  }))

  const commentMap = {}
  flatComments.forEach(c => { commentMap[c.id] = c })
  const rootComments = []
  flatComments.forEach(c => {
    if (c.parentId && commentMap[c.parentId]) {
      commentMap[c.parentId].replies.push(c)
    } else {
      rootComments.push(c)
    }
  })

  return {
    id: raw.id,
    title: raw.title || '',
    content: raw.content,
    excerpt: raw.excerpt || '',
    type: raw.type || 'bubble',
    tags: raw.tags || [],
    cover: raw.cover || null,
    expiresAt: raw.expires_at ? new Date(raw.expires_at).getTime() : null,
    viewCount: raw.view_count || 0,
    date: raw.created_at,
    author: raw.profiles?.nickname || raw.profiles?.username || '',
    authorUsername: raw.profiles?.username || '',
    authorId: raw.author_id,
    authorAvatar: raw.profiles?.avatar_url || null,
    likes: (raw.likes || []).map(l => l.user_id),
    comments: rootComments,
    readTime: Math.max(1, Math.ceil((raw.content || '').length / 500)),
  }
}

const POST_SELECT = `
  *,
  profiles(username, nickname, avatar_url),
  likes(user_id),
  comments(id, author_id, content, created_at, parent_id, profiles(username, nickname))
`

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [recentlyViewed, setRecentlyViewed] = useState(loadRecent)

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })

    if (!error && data) {
      const now = Date.now()
      setPosts(data.map(mapPost).filter(p => !p.expiresAt || p.expiresAt > now))
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null)
      if (session?.user) fetchPosts()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null)
      if (session?.user) fetchPosts()
      else setPosts([])
    })

    return () => subscription.unsubscribe()
  }, [fetchPosts])

  // 만료된 Pop 글 자동 삭제
  useEffect(() => {
    const purgeExpired = () => setPosts(prev => prev.filter(p => !p.expiresAt || p.expiresAt > Date.now()))
    const interval = setInterval(purgeExpired, 10 * 1000)
    const onVisible = () => { if (document.visibilityState === 'visible') purgeExpired() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', purgeExpired)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', purgeExpired)
    }
  }, [])

  const addRecentlyViewed = (postId) => {
    setRecentlyViewed(prev => {
      const next = [postId, ...prev.filter(id => id !== postId)].slice(0, MAX_RECENT)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }

  const addPost = async (post) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: session.user.id,
        title: post.title || '',
        content: post.content,
        excerpt: post.excerpt || post.content.slice(0, 100),
        type: post.type || 'bubble',
        tags: post.tags || [],
        expires_at: post.expiresAt ? new Date(post.expiresAt).toISOString() : null,
      })
      .select(POST_SELECT)
      .single()

    if (error || !data) return null
    const newPost = mapPost(data)
    setPosts(prev => [newPost, ...prev])
    return newPost
  }

  const updatePost = async (id, changes) => {
    const dbChanges = {}
    if (changes.title !== undefined) dbChanges.title = changes.title
    if (changes.content !== undefined) dbChanges.content = changes.content
    if (changes.tags !== undefined) dbChanges.tags = changes.tags
    if (changes.type !== undefined) dbChanges.type = changes.type
    if (changes.expiresAt !== undefined) dbChanges.expires_at = changes.expiresAt ? new Date(changes.expiresAt).toISOString() : null

    const { error } = await supabase.from('posts').update(dbChanges).eq('id', id)
    if (!error) setPosts(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p))
  }

  const deletePost = async (id) => {
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
  }

  const renameAuthor = async () => {
    await fetchPosts()
  }

  const incrementView = async (postId) => {
    const post = posts.find(p => p.id === postId)
    if (!post) return
    await supabase.from('posts').update({ view_count: post.viewCount + 1 }).eq('id', postId)
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, viewCount: p.viewCount + 1 }))
  }

  const toggleLike = async (postId) => {
    if (!currentUserId) return
    const post = posts.find(p => p.id === postId)
    const already = (post?.likes || []).includes(currentUserId)

    if (already) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUserId)
      setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, likes: p.likes.filter(id => id !== currentUserId) }))
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId })
      setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, likes: [...(p.likes || []), currentUserId] }))
    }
  }

  const isLiked = (postId) => {
    if (!currentUserId) return false
    const p = posts.find(p => p.id === postId)
    return p ? (p.likes || []).includes(currentUserId) : false
  }

  const addComment = async (postId, content) => {
    if (!currentUserId) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: currentUserId, content })
      .select('id, author_id, content, created_at, parent_id, profiles(username, nickname)')
      .single()

    if (error || !data) return
    const comment = {
      id: data.id,
      author: data.profiles?.nickname || data.profiles?.username || '',
      authorUsername: data.profiles?.username || '',
      authorId: data.author_id,
      content: data.content,
      date: data.created_at,
      parentId: null,
      replies: [],
    }
    setPosts(prev => prev.map(p => p.id !== postId ? p : { ...p, comments: [...(p.comments || []), comment] }))
  }

  const deleteComment = async (postId, commentId) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      comments: (p.comments || []).filter(c => c.id !== commentId)
    }))
  }

  const addReply = async (postId, commentId, content) => {
    if (!currentUserId) return
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: currentUserId, content, parent_id: commentId })
      .select('id, author_id, content, created_at, parent_id, profiles(username, nickname)')
      .single()

    if (error || !data) return
    const reply = {
      id: data.id,
      author: data.profiles?.nickname || data.profiles?.username || '',
      authorUsername: data.profiles?.username || '',
      authorId: data.author_id,
      content: data.content,
      date: data.created_at,
    }
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      comments: (p.comments || []).map(c =>
        c.id !== commentId ? c : { ...c, replies: [...(c.replies || []), reply] }
      )
    }))
  }

  const deleteReply = async (postId, commentId, replyId) => {
    await supabase.from('comments').delete().eq('id', replyId)
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      comments: (p.comments || []).map(c =>
        c.id !== commentId ? c : { ...c, replies: (c.replies || []).filter(r => r.id !== replyId) }
      )
    }))
  }

  return (
    <PostsContext.Provider value={{ posts, currentUserId, addPost, updatePost, deletePost, renameAuthor, addComment, deleteComment, addReply, deleteReply, incrementView, toggleLike, isLiked, recentlyViewed, addRecentlyViewed }}>
      {children}
    </PostsContext.Provider>
  )
}

export function usePosts() {
  return useContext(PostsContext)
}
