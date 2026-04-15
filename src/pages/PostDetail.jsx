import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { haptic } from '../lib/haptic'
import { useProfile } from '../context/ProfileContext'
import { useBookmark } from '../context/BookmarkContext'
import { supabase } from '../lib/supabase'
import { searchMentionUsers, sendMentionNotifs } from '../lib/mentions'
import MentionDropdown from '../components/MentionDropdown'

function formatRemaining(expiresAt) {
  const ms = expiresAt - Date.now()
  if (ms <= 0) return '만료'
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}초 후 삭제`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}분 후 삭제`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 후 삭제`
  const d = Math.floor(h / 24)
  return `${d}일 후 삭제`
}

// 마크다운 스타일 본문 파싱
function parseContent(content) {
  const blocks = []
  const lines = content.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      blocks.push({ type: 'code', lang, content: codeLines.join('\n') })
      i++
      continue
    }

    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', content: line.slice(3) })
      i++
      continue
    }

    if (line.trim() === '') { i++; continue }

    blocks.push({ type: 'p', content: line })
    i++
  }

  return blocks
}

function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

function renderWithMentions(text) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g)
  return parts.map((part, i) =>
    /^@[a-zA-Z0-9_]+$/.test(part) ? (
      <Link key={i} to={`/user/${part.slice(1)}`} className="font-semibold" style={{ color: 'var(--mention-color, #6b7280)' }}>{part}</Link>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function ContentBlock({ block }) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 className="text-xl font-bold text-gray-800 mt-10 mb-4 leading-snug">
          {block.content}
        </h2>
      )
    case 'code':
      return (
        <div className="my-6 rounded-2xl overflow-hidden" style={{ border: '1px solid var(--divider)' }}>
          {block.lang && (
            <div className="px-4 py-2 text-xs text-gray-400 font-mono bg-white border-b border-gray-100">
              {block.lang}
            </div>
          )}
          <pre className="px-5 py-4 overflow-x-auto bg-gray-50">
            <code className="text-sm text-gray-600 font-mono leading-relaxed">
              {block.content}
            </code>
          </pre>
        </div>
      )
    case 'p':
      return (
        <p className="text-gray-600 leading-[1.85] text-[15px]">
          <InlineText text={block.content} />
        </p>
      )
    default:
      return null
  }
}


function CommentCard({ comment, onDelete, canDelete, onReply, onDeleteReply, profile }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDeleteReplyId, setConfirmDeleteReplyId] = useState(null)
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replyMentionQuery, setReplyMentionQuery] = useState(null)
  const [replyMentionResults, setReplyMentionResults] = useState([])
  const replyInputRef = useRef(null)
  const d = new Date(comment.date)
  const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const submitReply = () => {
    if (!replyText.trim()) return
    onReply(replyText.trim())
    setReplyText('')
    setShowReplyInput(false)
  }

  useEffect(() => {
    if (replyMentionQuery === null || replyMentionQuery.length === 0) { setReplyMentionResults([]); return }
    const timer = setTimeout(async () => {
      setReplyMentionResults(await searchMentionUsers(replyMentionQuery))
    }, 250)
    return () => clearTimeout(timer)
  }, [replyMentionQuery])

  return (
    <>
      <div className="py-4 border-b border-gray-100 last:border-none">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center mt-0.5" style={{ background: 'var(--avatar-bg)' }}>
            <span className="text-gray-500 text-xs font-semibold">{comment.author[0].toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-700">{comment.author}</span>
              <span className="text-xs text-gray-400">{dateStr}</span>
              {canDelete && (
                <button onClick={() => setConfirmDelete(true)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                    <path d="M2 4h12M5 4V2h6v2M13 4l-.8 9.5a1 1 0 0 1-1 .9H4.8a1 1 0 0 1-1-.9L3 4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{renderWithMentions(comment.content)}</p>
            <button
              onClick={() => setShowReplyInput((v) => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1.5 transition-colors"
            >
              답글
            </button>
          </div>
        </div>

        {/* 답글 목록 */}
        {(comment.replies || []).length > 0 && (
          <div className="ml-11 mt-3 space-y-3">
            {comment.replies.map((reply) => {
              const rd = new Date(reply.date)
              const rDateStr = `${String(rd.getMonth() + 1).padStart(2, '0')} · ${String(rd.getDate()).padStart(2, '0')} · ${String(rd.getHours()).padStart(2, '0')}:${String(rd.getMinutes()).padStart(2, '0')}`
              return (
                <div key={reply.id} className="flex gap-2.5">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center mt-0.5" style={{ background: 'var(--avatar-bg)' }}>
                    <span className="text-gray-500 font-semibold" style={{ fontSize: '9px' }}>{reply.author[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-700">{reply.author}</span>
                      <span className="text-xs text-gray-400">{rDateStr}</span>
                      {reply.author === profile.name && (
                        <button onClick={() => setConfirmDeleteReplyId(reply.id)} className="ml-auto text-gray-300 hover:text-red-400 transition-colors">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3 h-3">
                            <path d="M2 4h12M5 4V2h6v2M13 4l-.8 9.5a1 1 0 0 1-1 .9H4.8a1 1 0 0 1-1-.9L3 4" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{renderWithMentions(reply.content)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 답글 입력 */}
        {showReplyInput && (
          <div className="ml-11 mt-2 flex gap-2">
            <div className="flex-1 relative">
              {replyMentionResults.length > 0 && (
                <MentionDropdown
                  results={replyMentionResults}
                  onSelect={(username) => {
                    const cursor = replyInputRef.current?.selectionStart ?? replyText.length
                    const textBefore = replyText.slice(0, cursor)
                    const match = textBefore.match(/@(\w*)$/)
                    if (match) {
                      const start = cursor - match[0].length
                      setReplyText(replyText.slice(0, start) + `@${username} ` + replyText.slice(cursor))
                    }
                    setReplyMentionQuery(null)
                    setReplyMentionResults([])
                  }}
                />
              )}
              <input
                ref={replyInputRef}
                autoFocus
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value)
                  const cursor = e.target.selectionStart
                  const textBefore = e.target.value.slice(0, cursor)
                  const match = textBefore.match(/@(\w*)$/)
                  setReplyMentionQuery(match ? match[1] : null)
                  if (!match) setReplyMentionResults([])
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setReplyMentionQuery(null); setReplyMentionResults([]) }
                  else if (e.key === 'Enter' && !replyMentionResults.length) submitReply()
                }}
                placeholder={`${comment.author}에게 답글...`}
                className="w-full rounded-xl px-3 py-1.5 text-xs text-gray-700 placeholder-gray-300 bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300"
              />
            </div>
            <button
              onClick={submitReply}
              disabled={!replyText.trim()}
              className="w-7 h-7 flex items-center justify-center text-white bg-gray-700 rounded-xl disabled:opacity-40 flex-shrink-0"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M8 13V3M3 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(false)}>
          <div className="w-72 rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--dialog-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 text-center">댓글을 삭제하시겠어요?</p>
            <p className="text-xs text-gray-400 text-center -mt-2">삭제된 댓글은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>취소</button>
              <button onClick={() => { onDelete(); setConfirmDelete(false) }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteReplyId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDeleteReplyId(null)}>
          <div className="w-72 rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'var(--dialog-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-800 text-center">답글을 삭제하시겠어요?</p>
            <p className="text-xs text-gray-400 text-center -mt-2">삭제된 답글은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteReplyId(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>취소</button>
              <button onClick={() => { onDeleteReply(confirmDeleteReplyId); setConfirmDeleteReplyId(null) }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors">삭제</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function PostDetail() {
  const { posts, deletePost, addComment, deleteComment, addReply, deleteReply, toggleLike, toggleRebubble, addRecentlyViewed, currentUserId } = usePosts()
  const { profile } = useProfile()
  const { toggleBookmark, isBookmarked } = useBookmark()
  const { id } = useParams()
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const [showComments, setShowComments] = useState(!!locationState?.openComments)
  const [commentText, setCommentText] = useState('')
  const [commentMentionQuery, setCommentMentionQuery] = useState(null)
  const [commentMentionResults, setCommentMentionResults] = useState([])
  const commentInputRef = useRef(null)
  const [commentTranslate, setCommentTranslate] = useState(40)
  const [commentDragging, setCommentDragging] = useState(false)
  const dragStartY = useRef(0)
  const dragStartTranslate = useRef(40)
  const [reactionsSheet, setReactionsSheet] = useState(null) // { type: 'likes'|'rebubbles', users: [] }
  const longPressTimer = useRef(null)

  const openReactions = async (type) => {
    const ids = type === 'likes' ? (post?.likes || []) : (post?.rebubbles || [])
    if (ids.length === 0) { setReactionsSheet({ type, users: [] }); return }
    const { data } = await supabase.from('profiles').select('username, nickname, avatar_url, bio').in('id', ids)
    setReactionsSheet({ type, users: (data || []).map(p => ({ username: p.username, name: p.nickname || p.username, avatar: p.avatar_url, bio: p.bio })) })
  }

  const startLongPress = (type) => {
    longPressTimer.current = setTimeout(() => { haptic(20); openReactions(type) }, 500)
  }
  const cancelLongPress = () => { clearTimeout(longPressTimer.current) }

  useEffect(() => {
    if (showComments) setCommentTranslate(40)
  }, [showComments])

  useEffect(() => {
    if (commentMentionQuery === null || commentMentionQuery.length === 0) { setCommentMentionResults([]); return }
    const timer = setTimeout(async () => {
      setCommentMentionResults(await searchMentionUsers(commentMentionQuery))
    }, 250)
    return () => clearTimeout(timer)
  }, [commentMentionQuery])

  const closeComments = () => {
    setCommentTranslate(100)
    setTimeout(() => setShowComments(false), 300)
  }

  const handleDragStart = (e) => {
    dragStartY.current = e.touches[0].clientY
    dragStartTranslate.current = commentTranslate
    setCommentDragging(true)
  }

  const handleDragMove = (e) => {
    const dy = e.touches[0].clientY - dragStartY.current
    const panelH = window.innerHeight * 0.85
    const next = dragStartTranslate.current + (dy / panelH) * 100
    setCommentTranslate(Math.max(-3, next))
  }

  const handleDragEnd = () => {
    setCommentDragging(false)
    if (commentTranslate > 60) {
      closeComments()
    } else if (commentTranslate > 20) {
      setCommentTranslate(40) // mid
    } else {
      setCommentTranslate(0) // expanded
    }
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  useEffect(() => {
    if (id) addRecentlyViewed(id)
  }, [id])

  useEffect(() => {
    if (!reportDone) return
    const t = setTimeout(() => setReportDone(false), 2500)
    return () => clearTimeout(t)
  }, [reportDone])
  const [fetchedPost, setFetchedPost] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [authorPosts, setAuthorPosts] = useState(null)

  const postFromCtx = posts.find((p) => String(p.id) === String(id))
  const post = postFromCtx ?? fetchedPost

  // fetchedPost일 때 좋아요/리버블 상태를 로컬에서도 업데이트
  const handleToggleLike = async () => {
    if (!post || !currentUserId) return
    haptic(12)
    const newLiked = await toggleLike(post.id, post.likes)
    if (!postFromCtx && fetchedPost) {
      setFetchedPost(prev => ({
        ...prev,
        likes: newLiked
          ? [...(prev.likes || []), currentUserId]
          : (prev.likes || []).filter(id => id !== currentUserId),
      }))
    }
  }

  const handleToggleRebubble = async () => {
    if (!post || !currentUserId) return
    haptic(12)
    const newRebubbled = await toggleRebubble(post.id, post.rebubbles)
    if (!postFromCtx && fetchedPost) {
      setFetchedPost(prev => ({
        ...prev,
        rebubbles: newRebubbled
          ? [...(prev.rebubbles || []), currentUserId]
          : (prev.rebubbles || []).filter(id => id !== currentUserId),
      }))
    }
  }

  const postLiked = currentUserId && post ? (post.likes || []).includes(currentUserId) : false
  const postRebubbled = currentUserId && post ? (post.rebubbles || []).includes(currentUserId) : false

  useEffect(() => {
    if (post) return
    supabase
      .from('posts')
      .select('*, profiles(username, nickname, avatar_url), likes(user_id), rebubbles(user_id), comments(id, author_id, content, created_at, parent_id, profiles(username, nickname))')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) { setNotFound(true); return }
        const flat = (data.comments || []).map(c => ({
          id: c.id, author: c.profiles?.nickname || c.profiles?.username || '',
          authorId: c.author_id, content: c.content, date: c.created_at, parentId: c.parent_id || null, replies: [],
        }))
        const map = {}; flat.forEach(c => { map[c.id] = c })
        const roots = []; flat.forEach(c => { if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(c); else roots.push(c) })
        setFetchedPost({
          id: data.id, title: data.title || '', content: data.content, excerpt: data.excerpt || '',
          type: data.type || 'bubble', tags: data.tags || [], cover: data.cover || null,
          expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : null,
          viewCount: data.view_count || 0, date: data.created_at,
          author: data.profiles?.nickname || data.profiles?.username || '',
          authorUsername: data.profiles?.username || '', authorId: data.author_id,
          authorAvatar: data.profiles?.avatar_url || null,
          likes: (data.likes || []).map(l => l.user_id),
          rebubbles: (data.rebubbles || []).map(r => r.user_id), comments: roots,
          readTime: Math.max(1, Math.ceil((data.content || '').length / 500)),
        })
      })
  }, [id, post])

  // 작성자의 다른 글 목록 (이전/다음 네비게이션용)
  useEffect(() => {
    if (!post) return
    const ctxAuthorPosts = posts.filter((p) => p.authorId === post.authorId)
    if (ctxAuthorPosts.length > 0) {
      setAuthorPosts(ctxAuthorPosts)
    } else {
      supabase.from('posts').select('id, title, created_at').eq('author_id', post.authorId).order('created_at', { ascending: false }).limit(50)
        .then(({ data }) => { if (data) setAuthorPosts(data.map(p => ({ id: p.id, title: p.title, date: p.created_at }))) })
    }
  }, [post?.authorId])

  const isSample = false
  const isOwn = !!currentUserId && !!post && post.authorId === currentUserId

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-20 text-center">
        <p className="text-gray-400 text-sm mb-4">포스트를 찾을 수 없습니다.</p>
        <Link to="/" className="text-sm font-medium text-gray-700 underline underline-offset-2">홈으로 돌아가기</Link>
      </div>
    )
  }

  if (!post) return null

  const isHTML = /<[a-z][\s\S]*>/i.test(post.content ?? '')

  function htmlToPlainLines(html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
  }

  const rawContent = isHTML ? htmlToPlainLines(post.content) : (post.content ?? '')
  const hasMarkdown = /```|^##\s/m.test(rawContent)
  const blocks = (isHTML && !hasMarkdown) ? null : parseContent(rawContent)
  const _d = new Date(post.date)
  const formattedDate = `${_d.getFullYear()} · ${String(_d.getMonth() + 1).padStart(2, '0')} · ${String(_d.getDate()).padStart(2, '0')} · ${String(_d.getHours()).padStart(2, '0')}:${String(_d.getMinutes()).padStart(2, '0')}`

  const navPosts = authorPosts ?? []
  const currentIndex = isSample ? -1 : navPosts.findIndex((p) => String(p.id) === String(post?.id))
  const prevPost = currentIndex >= 0 ? (navPosts[currentIndex + 1] ?? null) : null
  const nextPost = currentIndex > 0 ? (navPosts[currentIndex - 1] ?? null) : null

  return (
    <>
      {/* 본문 영역 */}
      <div style={{ background: 'var(--dialog-bg)' }}>
        <div className="max-w-3xl mx-auto px-5 pt-8 pb-10 space-y-5 relative">
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <Link key={tag} to={`/tag/${tag}`} className="text-xs font-semibold text-gray-400 hover:text-gray-600 tracking-wide uppercase transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-extrabold text-gray-800 leading-tight tracking-tight">
              {post.title}
            </h1>
            {/* 점 세 개 메뉴 */}
            <div className="relative flex-shrink-0 mt-1">
              <button
                onClick={() => { setMenuOpen((v) => !v); setConfirmDelete(false) }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <circle cx="10" cy="4" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="10" cy="16" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              )}
              {menuOpen && (
                <div
                  className="absolute right-0 top-9 z-50 w-28 rounded-xl overflow-hidden"
                  style={{ background: 'var(--dropdown-bg)', backdropFilter: 'blur(16px)', boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid var(--divider)' }}
                >
                  {isOwn && (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); navigate(`/write/edit/${post.id}`) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400"><path d="M11 1h4v4M15 1l-6 6M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        수정
                      </button>
                      <div className="h-px bg-gray-100" />
                    </>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      const url = `${window.location.origin}/post/${post.id}`
                      if (navigator.share) navigator.share({ title: post.title, url })
                      else navigator.clipboard.writeText(url)
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400"><circle cx="12" cy="3" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="13" r="1.8"/><path d="M5.8 9l4.4 2.5M10.2 4.5L5.8 7" strokeLinecap="round"/></svg>
                    공유
                  </button>
                  <div className="h-px bg-gray-100" />
                  {isOwn ? (
                    <button
                      onClick={() => { setMenuOpen(false); setConfirmDelete(true) }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5"><path d="M2 4h12M5 4V2h6v2M13 4l-.8 9.5a1 1 0 0 1-1 .9H4.8a1 1 0 0 1-1-.9L3 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      삭제
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); toggleBookmark(post.id) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2.5"
                      >
                        <svg viewBox="0 0 16 16" fill={isBookmarked(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5 text-gray-400">
                          <path d="M3 2h10v13l-5-3-5 3V2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {isBookmarked(post.id) ? '저장됨' : '저장'}
                      </button>
                      <div className="h-px bg-gray-100" />
                      <button
                        onClick={() => { setMenuOpen(false); setReportDone(true) }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-50 transition-colors flex items-center gap-2.5"
                      >
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5"><path d="M8 1.5L1.5 13h13L8 1.5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 6v3.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none"/></svg>
                        신고
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Pop 삭제 타이머 배지 */}
          {post.type === 'pop' && post.expiresAt && (
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ color: '#9ca3af' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                {formatRemaining(post.expiresAt)}
              </span>
            </div>
          )}
          {/* 프로필 */}
          <div className="flex items-center gap-3 mt-2">
            <Link to={isOwn ? '/' : `/user/${post.authorUsername || post.author}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity min-w-0">
              <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                {isOwn && profile.avatar ? (
                  <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : post.authorAvatar ? (
                  <img src={post.authorAvatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600 text-xs font-semibold">{(post.author || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-gray-700 truncate">{post.author}</span>
            </Link>
            <span className="text-xs text-gray-400 flex-shrink-0">{formattedDate}</span>
            <div className="flex-1 h-px bg-gray-100" />
            <span
              className="text-xs font-bold tracking-widest uppercase flex-shrink-0"
              style={{ color: '#9ca3af' }}
            >
              {post.type === 'pop' ? 'Pop' : 'Log'}
            </span>
          </div>
          <div className="pt-3 space-y-5">
            {(isHTML && !hasMarkdown)
              ? <div className="write-editor text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
              : blocks.map((block, i) => <ContentBlock key={i} block={block} />)
            }
          </div>
        </div>
      </div>

      {/* 하단 영역 */}
      <div style={{ background: 'var(--dialog-bg)' }}>
        <div className="max-w-3xl mx-auto px-5 py-10">

          {/* 이전/다음 포스트 */}
          <nav className="mb-12 border-t border-gray-100">
            {prevPost && (
              <Link
                to={`/post/${prevPost.id}`}
                className="group flex flex-col gap-1 py-4 border-b border-gray-100 hover:border-gray-300 transition-colors"
              >
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7.5 9L4.5 6l3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  이전 글
                </span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-400 transition-colors line-clamp-1">
                  {prevPost.title}
                </span>
              </Link>
            )}
            {nextPost && (
              <Link
                to={`/post/${nextPost.id}`}
                className="group flex flex-col gap-1 py-4 border-b border-gray-100 hover:border-gray-300 transition-colors items-end text-right"
              >
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  다음 글
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4.5 9L7.5 6l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-400 transition-colors line-clamp-1">
                  {nextPost.title}
                </span>
              </Link>
            )}
          </nav>

        </div>
      </div>

      {/* 댓글 패널 */}
      {showComments && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: `rgba(0,0,0,${0.2 * (1 - commentTranslate / 100)})` }}
            onClick={closeComments}
          />
          <div
            data-no-ptr
            className="fixed left-0 right-0 bottom-0 z-50 flex flex-col rounded-t-3xl"
            style={{
              height: '85vh',
              background: 'var(--sheet-bg)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
              transform: `translateY(${commentTranslate}%)`,
              transition: commentDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* 드래그 핸들 */}
            <div
              className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
              style={{ touchAction: 'none' }}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            {/* 헤더 */}
            <div
              className="px-5 pb-3 flex items-center justify-between flex-shrink-0 cursor-grab active:cursor-grabbing"
              style={{ borderBottom: '1px solid var(--divider)', touchAction: 'none' }}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
            >
              <h3 className="text-sm font-bold text-gray-700">댓글 <span className="text-gray-400 font-normal">{(post?.comments || []).reduce((s, c) => s + 1 + (c.replies?.length || 0), 0)}</span></h3>
              <button
                onTouchStart={(e) => e.stopPropagation()}
                onClick={closeComments}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            {/* 댓글 목록 */}
            <div className="px-5 py-3 overflow-y-auto flex-1" style={{ paddingBottom: '80px' }}>
              {(post?.comments || []).length === 0 && (
                <p className="text-xs text-gray-300 text-center py-10">아직 댓글이 없습니다.</p>
              )}
              {[...(post?.comments || [])].reverse().map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  canDelete={comment.author === profile.name}
                  onDelete={() => deleteComment(post.id, comment.id)}
                  onReply={async (text) => { addReply(post.id, comment.id, text); sendMentionNotifs(text, post.id, comment.id, currentUserId) }}
                  onDeleteReply={(replyId) => deleteReply(post.id, comment.id, replyId)}
                  profile={profile}
                />
              ))}
            </div>
          </div>
          {/* 입력창 - 항상 화면 하단 고정 */}
          <div
            className="fixed left-0 right-0 z-50 px-5 pt-3"
            style={{
              bottom: 0,
              background: 'var(--sheet-bg)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid var(--divider)',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
            }}
          >
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault()
                const text = commentText.trim()
                if (text) {
                  addComment(post.id, text)
                  sendMentionNotifs(text, post.id, null, currentUserId)
                  setCommentText('')
                  setCommentMentionQuery(null)
                  setCommentMentionResults([])
                }
              }}
            >
              <div className="flex-1 relative">
                {commentMentionResults.length > 0 && (
                  <MentionDropdown
                    results={commentMentionResults}
                    onSelect={(username) => {
                      const cursor = commentInputRef.current?.selectionStart ?? commentText.length
                      const textBefore = commentText.slice(0, cursor)
                      const match = textBefore.match(/@(\w*)$/)
                      if (match) {
                        const start = cursor - match[0].length
                        setCommentText(commentText.slice(0, start) + `@${username} ` + commentText.slice(cursor))
                      }
                      setCommentMentionQuery(null)
                      setCommentMentionResults([])
                    }}
                  />
                )}
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => {
                    setCommentText(e.target.value)
                    const cursor = e.target.selectionStart
                    const textBefore = e.target.value.slice(0, cursor)
                    const match = textBefore.match(/@(\w*)$/)
                    setCommentMentionQuery(match ? match[1] : null)
                    if (!match) setCommentMentionResults([])
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setCommentMentionQuery(null); setCommentMentionResults([]) }
                  }}
                  placeholder="댓글을 입력하세요..."
                  className="w-full rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-300 bg-gray-50 border border-gray-100 focus:outline-none focus:border-gray-300"
                />
              </div>
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="w-9 h-9 flex items-center justify-center text-white bg-gray-700 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M8 13V3M3 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        </>
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

      {/* 삭제 확인 다이얼로그 */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="w-72 rounded-2xl p-6 flex flex-col gap-4"
            style={{ background: 'var(--dialog-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-gray-800 text-center">삭제하시겠습니까?</p>
            <p className="text-xs text-gray-400 text-center -mt-2">삭제된 글은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                style={{ border: '1px solid var(--divider)' }}
              >
                취소
              </button>
              <button
                onClick={() => { deletePost(post.id); navigate('/') }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-gray-400 hover:bg-gray-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 액션 바 */}
      <div
        className="fixed left-0 right-0 z-40 flex items-center justify-around px-8"
        style={{
          bottom: '0',
          height: '56px',
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--divider)',
        }}
      >
        {/* 좋아요 */}
        <button
          onClick={handleToggleLike}
          onMouseDown={() => startLongPress('likes')}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={() => startLongPress('likes')}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          className="flex items-center gap-2 transition-all active:scale-95"
          style={{ color: postLiked ? '#ef4444' : '#9ca3af' }}
        >
          <svg viewBox="0 0 24 24" fill={postLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
            <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium">{post ? (post.likes?.length || 0) : 0}</span>
        </button>

        {/* 구분 */}
        <div className="w-px h-5 bg-gray-200" />

        {/* 리버블 */}
        <button
          onClick={handleToggleRebubble}
          onMouseDown={() => startLongPress('rebubbles')}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
          onTouchStart={() => startLongPress('rebubbles')}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          className="flex items-center gap-2 transition-all active:scale-95"
          style={{ color: postRebubbled ? '#3b82f6' : '#9ca3af' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5">
            <circle cx="8" cy="15" r="5" strokeWidth={1.3} />
            <ellipse cx="5.9" cy="12.9" rx="1.6" ry="0.9" fill="currentColor" opacity={0.25} transform="rotate(-30 5.9 12.9)" />
            <circle cx="18" cy="7" r="3" strokeWidth={1.2} />
            <ellipse cx="16.9" cy="5.9" rx="0.9" ry="0.5" fill="currentColor" opacity={0.25} transform="rotate(-30 16.9 5.9)" />
            <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.1} />
            <ellipse cx="18.8" cy="16.8" rx="0.55" ry="0.32" fill="currentColor" opacity={0.25} transform="rotate(-30 18.8 16.8)" />
          </svg>
          <span className="text-sm font-medium">{post ? (post.rebubbles?.length || 0) : 0}</span>
        </button>

        {/* 구분 */}
        <div className="w-px h-5 bg-gray-200" />

        {/* 댓글 */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-2 transition-all active:scale-95"
          style={{ color: showComments ? '#374151' : '#9ca3af' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-sm font-medium">{(post?.comments || []).reduce((s, c) => s + 1 + (c.replies?.length || 0), 0)}</span>
        </button>

      </div>
    {/* 좋아요/리버블 목록 시트 */}
    {reactionsSheet && (
      <>
        <div className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} onClick={() => setReactionsSheet(null)} />
        <div className="fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl flex flex-col" style={{ maxHeight: '60vh', background: 'var(--sheet-bg)', backdropFilter: 'blur(20px)', boxShadow: '0 -4px 30px rgba(0,0,0,0.2)' }}>
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>
          <div className="px-5 py-3 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--divider)' }}>
            {reactionsSheet.type === 'likes' ? (
              <svg viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.8" className="w-4 h-4">
                <path d="M12 21C12 21 3 14.5 3 8.5a4.5 4.5 0 0 1 9-0.5 4.5 4.5 0 0 1 9 0.5C21 14.5 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" className="w-4 h-4">
                <circle cx="8" cy="15" r="5" strokeWidth={1.3}/>
                <circle cx="18" cy="7" r="3" strokeWidth={1.2}/>
                <circle cx="19.5" cy="17.5" r="1.8" strokeWidth={1.1}/>
              </svg>
            )}
            <p className="text-sm font-bold text-gray-800">
              {reactionsSheet.type === 'likes' ? '좋아요' : 'Rebubble'} {reactionsSheet.users.length}
            </p>
          </div>
          <div className="overflow-y-auto flex-1 px-5 py-2 pb-10">
            {reactionsSheet.users.length === 0 ? (
              <p className="text-sm text-gray-300 text-center py-8">아직 없습니다.</p>
            ) : reactionsSheet.users.map((u) => (
              <button
                key={u.username}
                onClick={() => { setReactionsSheet(null); navigate(`/user/${u.username}`) }}
                className="w-full flex items-center gap-3 py-3 active:opacity-60 transition-opacity"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
                  {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover rounded-full" /> : <span className="text-sm font-bold text-gray-500">{u.name[0]?.toUpperCase()}</span>}
                </div>
                <div className="flex flex-col items-start min-w-0">
                  <span className="text-sm font-semibold text-gray-800">{u.name}</span>
                  {u.bio && <span className="text-xs text-gray-400 truncate w-full">{u.bio}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      </>
    )}
    </>
  )
}
