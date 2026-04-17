import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useDraft } from '../context/DraftContext'
import { searchMentionUsers, sendMentionNotifs } from '../lib/mentions'
import MentionDropdown from '../components/MentionDropdown'
import SourcePicker from '../components/SourcePicker'

const TOOLBAR = [
  { label: 'B', title: 'Bold',          cmd: 'bold',          style: { fontWeight: 800, fontSize: '14px' } },
  { label: 'I', title: 'Italic',        cmd: 'italic',        style: { fontStyle: 'italic', fontSize: '14px' } },
  { label: 'U', title: 'Underline',     cmd: 'underline',     style: { textDecoration: 'underline', fontSize: '14px' } },
  { label: 'S', title: 'Strikethrough', cmd: 'strikethrough', style: { textDecoration: 'line-through', fontSize: '13px' } },
]

const TOOLBAR_MORE = [
  { label: 'H1', title: 'Heading 1', cmd: 'formatBlock', value: 'h1', style: { fontWeight: 800, fontSize: '11px', letterSpacing: '-0.02em' } },
  { label: 'H2', title: 'Heading 2', cmd: 'formatBlock', value: 'h2', style: { fontWeight: 700, fontSize: '11px', letterSpacing: '-0.02em' } },
  {
    label: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-4 h-4"><line x1="4" y1="4" x2="4" y2="16" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="10" x2="16" y2="10" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="14" x2="16" y2="14" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    title: 'Quote', cmd: 'formatBlock', value: 'blockquote', style: {},
  },
  { label: '―', title: 'Divider', cmd: 'insertHorizontalRule', style: { fontSize: '16px', lineHeight: 1 } },
  {
    label: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><line x1="3" y1="5" x2="17" y2="5" strokeLinecap="round"/><line x1="3" y1="9" x2="13" y2="9" strokeLinecap="round"/><line x1="3" y1="13" x2="17" y2="13" strokeLinecap="round"/><line x1="3" y1="17" x2="11" y2="17" strokeLinecap="round"/></svg>,
    title: 'Align Left', cmd: 'justifyLeft', style: {},
  },
  {
    label: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><line x1="3" y1="5" x2="17" y2="5" strokeLinecap="round"/><line x1="5" y1="9" x2="15" y2="9" strokeLinecap="round"/><line x1="3" y1="13" x2="17" y2="13" strokeLinecap="round"/><line x1="5" y1="17" x2="15" y2="17" strokeLinecap="round"/></svg>,
    title: 'Align Center', cmd: 'justifyCenter', style: {},
  },
  {
    label: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><line x1="3" y1="5" x2="17" y2="5" strokeLinecap="round"/><line x1="7" y1="9" x2="17" y2="9" strokeLinecap="round"/><line x1="3" y1="13" x2="17" y2="13" strokeLinecap="round"/><line x1="9" y1="17" x2="17" y2="17" strokeLinecap="round"/></svg>,
    title: 'Align Right', cmd: 'justifyRight', style: {},
  },
]

export default function Write() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { posts, addPost, updatePost, currentUserId } = usePosts()
  const { drafts, saveDraft, deleteDraft } = useDraft()

  const isEdit = !!id
  const editPost = isEdit ? posts.find((p) => String(p.id) === id) : null

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [tags, setTags] = useState(editPost?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [hasContent, setHasContent] = useState(!!editPost?.content)
  const [expiry, setExpiry] = useState(60 * 60 * 1000) // 기본 1시간 (ms)
  const [customDate, setCustomDate] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [visibility, setVisibility] = useState(editPost?.visibility ?? 'public')
  const [showSourcePicker, setShowSourcePicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [activeColor, setActiveColor] = useState('#1f2937')
  const [activeFontSize, setActiveFontSize] = useState(null)
  const [activeFormats, setActiveFormats] = useState({})
  const [textAlign, setTextAlign] = useState('left')
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionResults, setMentionResults] = useState([])
  const mentionRangeRef = useRef(null)
  const savedRangeRef = useRef(null)
  const sourceDataMap = useRef({}) // pill ID → source data
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)
  const debounceRef = useRef(null)

  const isPop = editPost ? editPost.type === 'pop' : type === 'pop'
  const toolbarRef = useRef(null)

  // 세션마다 고유 draftId (Me탭에서 이어쓰기 진입 시 기존 ID 유지, 새로고침 시 sessionStorage에서 복원)
  const SESSION_KEY = `write_session_${type}`
  const sessionDraftId = useRef(
    location.state?.draftId
    ?? sessionStorage.getItem(SESSION_KEY)
    ?? `draft_${type}_${Date.now()}`
  )
  const tagJustAddedRef = useRef(false)
  const draftRestoredRef = useRef(false)

  // draft ID를 sessionStorage에 유지
  useEffect(() => {
    if (!isEdit) sessionStorage.setItem(SESSION_KEY, sessionDraftId.current)
  }, [])

  // 새로고침 후 즉시 복원 (Supabase 로드 전에 sessionStorage에서)
  useEffect(() => {
    if (isEdit || location.state?.draftId) return
    const raw = sessionStorage.getItem(`${SESSION_KEY}_snap`)
    if (!raw) return
    try {
      const { title: t, content: c, tags: tg } = JSON.parse(raw)
      if (t) setTitle(t)
      if (tg?.length) setTags(tg)
      if (c && editorRef.current) {
        editorRef.current.innerHTML = c
        setHasContent(true)
      }
      draftRestoredRef.current = true
    } catch (_) {}
  }, [])

  // 작성 중 새로고침 방지 (키보드 단축키 + 당겨서 새로고침)
  useEffect(() => {
    if (!hasContent && !title) return

    const blockKey = (e) => {
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key === 'r')) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('keydown', blockKey, true)

    document.documentElement.style.overscrollBehavior = 'none'

    return () => {
      document.removeEventListener('keydown', blockKey, true)
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [hasContent, title])

  // 사이즈 피커 외부 클릭 시 닫기
  useEffect(() => {
    if (!showSizePicker) return
    const handler = (e) => {
      if (!toolbarRef.current?.contains(e.target)) setShowSizePicker(false)
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [showSizePicker])

  // 키보드 뷰포트 대응
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      if (!toolbarRef.current) return
      const offset = Math.max(0, window.innerHeight - vv.offsetTop - vv.height)
      toolbarRef.current.style.transform = `translateY(${-offset}px)`
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  // 수정 모드일 때 에디터에 기존 내용 채우기
  useEffect(() => {
    if (isEdit && editPost && editorRef.current) {
      editorRef.current.innerHTML = editPost.content ?? ''
      setHasContent(!!editPost.content)
    }
  }, [isEdit, editPost?.id])

  // Me탭에서 이어쓰기로 진입 시 draft 복원
  useEffect(() => {
    if (isEdit) return
    const statedDraftId = location.state?.draftId
    if (!statedDraftId) return
    const target = drafts.find((d) => d.id === statedDraftId)
    if (target && editorRef.current) {
      setTitle(target.title ?? '')
      setTags(target.tags ?? [])
      editorRef.current.innerHTML = target.content ?? ''
      setHasContent(!!(target.content?.trim()))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // placeholder 처리
  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    const onFocus = () => el.classList.add('focused')
    const onBlur = () => el.classList.remove('focused')
    el.addEventListener('focus', onFocus)
    el.addEventListener('blur', onBlur)
    return () => {
      el.removeEventListener('focus', onFocus)
      el.removeEventListener('blur', onBlur)
    }
  }, [])

  // 언마운트 시 자동저장 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  // 포맷 상태 감지 + 선택 영역 자동 저장
  useEffect(() => {
    const update = () => {
      const sel = window.getSelection()
      if (!sel || !editorRef.current?.contains(sel.anchorNode)) return
      // 에디터 안의 선택 영역은 항상 최신으로 저장
      if (sel.rangeCount) savedRangeRef.current = sel.getRangeAt(0).cloneRange()
      const block = document.queryCommandValue('formatBlock').toLowerCase()
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikethrough'),
        h1: block === 'h1',
        h2: block === 'h2',
        blockquote: block === 'blockquote',
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
      })
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])

  // mention 검색
  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length === 0) { setMentionResults([]); return }
    const timer = setTimeout(async () => {
      setMentionResults(await searchMentionUsers(mentionQuery))
    }, 250)
    return () => clearTimeout(timer)
  }, [mentionQuery])

  // 자동저장 트리거 함수
  const triggerAutoSave = (overrides = {}) => {
    if (isEdit) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const currentTitle = overrides.title !== undefined ? overrides.title : title
      const currentContent = editorRef.current?.innerHTML ?? ''
      const currentTags = overrides.tags !== undefined ? overrides.tags : tags
      const contentText = editorRef.current?.innerText?.trim() ?? ''
      // title과 content 모두 비어있으면 저장 안 함
      if (!currentTitle.trim() && !contentText) return
      sessionStorage.setItem(`${SESSION_KEY}_snap`, JSON.stringify({
        title: currentTitle,
        content: currentContent,
        tags: currentTags,
      }))
      const now = Date.now()
      saveDraft({
        id: sessionDraftId.current,
        type,
        title: currentTitle,
        content: currentContent,
        tags: currentTags,
        savedAt: now,
      })
    }, 1500)
  }

  const handleTitleChange = (e) => {
    const val = e.target.value
    setTitle(val)
    triggerAutoSave({ title: val })
  }

  const handleTagsChange = (newTags) => {
    setTags(newTags)
    triggerAutoSave({ tags: newTags })
  }

  const handleInput = () => {
    const text = editorRef.current?.innerText?.trim() ?? ''
    setHasContent(text.length > 0)
    triggerAutoSave()
    // Detect @mention at cursor
    const sel = window.getSelection()
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0)
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const textBefore = range.startContainer.textContent.slice(0, range.startOffset)
        const match = textBefore.match(/@(\w*)$/)
        if (match) {
          setMentionQuery(match[1])
          mentionRangeRef.current = range.cloneRange()
          return
        }
      }
    }
    setMentionQuery(null)
  }

  const insertMentionInEditor = (username) => {
    const range = mentionRangeRef.current
    if (!range) return
    const container = range.startContainer
    const offset = range.startOffset
    const textBefore = container.textContent.slice(0, offset)
    const match = textBefore.match(/@(\w*)$/)
    if (!match) return
    const start = offset - match[0].length
    container.textContent = container.textContent.slice(0, start) + `@${username} ` + container.textContent.slice(offset)
    const newRange = document.createRange()
    const newOffset = start + username.length + 2
    newRange.setStart(container, Math.min(newOffset, container.textContent.length))
    newRange.collapse(true)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(newRange)
    setMentionQuery(null)
    setMentionResults([])
    mentionRangeRef.current = null
    setHasContent(true)
  }

  const COLORS = [
    { color: '#1f2937', label: '기본' },
    { color: '#6b7280', label: '회색' },
    { color: '#ef4444', label: '빨강' },
    { color: '#f97316', label: '주황' },
    { color: '#eab308', label: '노랑' },
    { color: '#22c55e', label: '초록' },
    { color: '#3b82f6', label: '파랑' },
    { color: '#8b5cf6', label: '보라' },
    { color: '#ec4899', label: '분홍' },
  ]

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel?.rangeCount) {
      const range = sel.getRangeAt(0)
      // 에디터 안에 커서가 있을 때만 저장
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange()
      }
    }
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
  }

  const applyColor = (color) => {
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand('foreColor', false, color)
    setActiveColor(color)
  }

  const FONT_SIZES = [10,11,12,13,14,15,16,17,18,19,20,21,22,23,24].map(s => ({ label: String(s), size: s }))

  const applyFontSize = (size) => {
    editorRef.current?.focus()
    restoreSelection()
    const sel = window.getSelection()
    if (!sel?.rangeCount) { setActiveFontSize(size); return }
    const range = sel.getRangeAt(0)
    if (range.collapsed) {
      // 커서만 있을 때: 빈 span 삽입 후 그 안에 커서 위치시켜 이후 입력에 크기 적용
      const span = document.createElement('span')
      span.style.fontSize = `${size}px`
      span.appendChild(document.createTextNode('\u200B')) // zero-width space
      range.insertNode(span)
      range.setStart(span.firstChild, 1)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } else {
      // 텍스트 선택 시: 선택 영역을 추출해 span으로 감싸기
      const fragment = range.extractContents()
      const span = document.createElement('span')
      span.style.fontSize = `${size}px`
      span.appendChild(fragment)
      range.insertNode(span)
      range.setStartAfter(span)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    }
    setActiveFontSize(size)
    triggerAutoSave()
  }

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text/plain').trim()
    if (/^https?:\/\/\S+$/.test(text)) {
      e.preventDefault()
      document.execCommand('insertHTML', false,
        `<a href="${text}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;word-break:break-all;">${text}</a>`)
      triggerAutoSave()
    }
  }

  // 기본 카드 (44px 커버 + 제목 + 아티스트/연도)
  const buildDefaultCard = (s) => {
    const coverHtml = s.cover
      ? `<img src="${s.cover}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;flex-shrink:0;pointer-events:none;" />`
      : `<div style="width:44px;height:44px;border-radius:10px;background:#e5e7eb;flex-shrink:0;"></div>`
    const meta = [s.creator, s.year].filter(Boolean).join(' · ')
    return `${coverHtml}<div style="flex:1;min-width:0;"><p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</p>${meta ? `<p style="font-size:11px;color:#9ca3af;margin:2px 0 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${meta}</p>` : ''}</div>`
  }

  // 확장 카드 (세로형: 커버 크게 + 아래에 제목/아티스트)
  const buildExpandedCard = (s) => {
    const coverHtml = s.cover
      ? `<img src="${s.cover}" style="width:120px;height:120px;border-radius:12px;object-fit:cover;display:block;pointer-events:none;" />`
      : `<div style="width:120px;height:120px;border-radius:12px;background:#e5e7eb;"></div>`
    const meta = [s.creator, s.year].filter(Boolean).join(' · ')
    return `<div style="display:inline-flex;flex-direction:column;gap:8px;">${coverHtml}<div><p style="font-size:13px;font-weight:700;color:#1f2937;margin:0 0 2px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.title}</p>${meta ? `<p style="font-size:11px;color:#6b7280;margin:0;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${meta}</p>` : ''}</div></div>`
  }

  const handleEditorPointerDown = (e) => {
    const embed = e.target.closest?.('[data-source-embed]')
    if (!embed) return
    e.preventDefault()

    let s = sourceDataMap.current[embed.dataset.sid]
    if (!s && embed.dataset.source) {
      try { s = JSON.parse(embed.dataset.source) } catch (_) {}
    }
    if (!s) return

    const startX = e.clientX
    const startY = e.clientY
    let dragging = false
    let ghost = null
    const embedRect = embed.getBoundingClientRect()

    const onMove = (ev) => {
      const dx = ev.clientX - startX
      const dy = ev.clientY - startY

      if (!dragging && Math.hypot(dx, dy) > 6) {
        dragging = true
        ghost = embed.cloneNode(true)
        ghost.style.cssText = `position:fixed;left:${embedRect.left}px;top:${embedRect.top}px;width:${embedRect.width}px;margin:0;pointer-events:none;opacity:0.8;z-index:9999;box-shadow:0 8px 20px rgba(0,0,0,0.15);transform:scale(1.02);`
        document.body.appendChild(ghost)
        embed.style.opacity = '0.3'
      }

      if (dragging && ghost) {
        ev.preventDefault()
        ghost.style.left = (ev.clientX - embedRect.width / 2) + 'px'
        ghost.style.top = (ev.clientY - 24) + 'px'
      }
    }

    const onUp = (ev) => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      if (ghost) { ghost.remove(); ghost = null }
      embed.style.opacity = '1'

      if (dragging) {
        // 드롭 위치에 카드 이동
        let range = null
        if (document.caretRangeFromPoint) {
          range = document.caretRangeFromPoint(ev.clientX, ev.clientY)
        } else if (document.caretPositionFromPoint) {
          const pos = document.caretPositionFromPoint(ev.clientX, ev.clientY)
          if (pos) { range = document.createRange(); range.setStart(pos.offsetNode, pos.offset) }
        }
        if (range && editorRef.current?.contains(range.startContainer)) {
          const inCard = (range.startContainer.nodeType === Node.ELEMENT_NODE
            ? range.startContainer
            : range.startContainer.parentElement)?.closest('[data-source-embed]')
          if (!inCard || inCard === embed) {
            embed.remove()
            range.insertNode(embed)
          }
        }
        triggerAutoSave()
      } else {
        // 탭: 확장/축소 토글
        const isExpanded = embed.dataset.expanded === 'true'
        if (isExpanded) {
          embed.dataset.expanded = 'false'
          embed.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:#f3f4f6;margin:8px 0;cursor:pointer;user-select:none;'
          embed.innerHTML = buildDefaultCard(s)
        } else {
          embed.dataset.expanded = 'true'
          embed.style.cssText = 'display:inline-block;padding:12px;border-radius:16px;background:#f3f4f6;margin:8px 0;cursor:pointer;user-select:none;'
          embed.innerHTML = buildExpandedCard(s)
        }
        triggerAutoSave()
      }
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  const handleEditorClick = (e) => {
    if (e.target.tagName !== 'IMG') return
    const img = e.target
    img.style.borderRadius = img.style.borderRadius === '12px' ? '0px' : '12px'
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    // 디바운스 타이머 취소 (제출 후 자동저장 방지)
    if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
    const contentHTML = editorRef.current?.innerHTML ?? ''
    const contentText = editorRef.current?.innerText ?? ''
    if (isEdit) {
      await updatePost(editPost.id, {
        title: title.trim(),
        content: contentHTML,
        excerpt: contentText.slice(0, 100).trim(),
        tags,
        visibility,
      })
      navigate(`/post/${editPost.id}`, { replace: true })
    } else {
      const newPost = await addPost({
        title: title.trim(),
        content: contentHTML,
        excerpt: contentText.slice(0, 100).trim(),
        tags,
        type,
        visibility,
        expiresAt: isPop
          ? expiry === 'custom'
            ? new Date(customDate).getTime()
            : Date.now() + expiry
          : null,
      })
      // 제출 성공 시 draft 삭제
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(`${SESSION_KEY}_snap`)
      deleteDraft(sessionDraftId.current)
      if (newPost) {
        sendMentionNotifs(contentText, newPost.id, null, currentUserId)
        navigate(`/post/${newPost.id}`, { replace: true })
      }
    }
  }

  const insertSourceInEditor = (s) => {
    setShowSourcePicker(false)
    const cardId = `src_${Date.now()}`
    sourceDataMap.current[cardId] = s

    const card = document.createElement('div')
    card.contentEditable = 'false'
    card.dataset.sourceEmbed = 'true'
    card.dataset.sid = cardId
    card.dataset.expanded = 'false'
    try { card.dataset.source = JSON.stringify(s) } catch (_) {}
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:#f3f4f6;margin:8px 0;cursor:pointer;user-select:none;'
    card.innerHTML = buildDefaultCard(s)

    const after = document.createElement('p')
    after.innerHTML = '<br>'

    editorRef.current?.focus()
    // savedRange가 에디터 안을 가리킬 때만 복원, 아니면 에디터 끝에 삽입
    const hasSavedRange = savedRangeRef.current &&
      editorRef.current?.contains(savedRangeRef.current.commonAncestorContainer)
    if (hasSavedRange) restoreSelection()

    const sel = window.getSelection()
    const rangeInEditor = sel?.rangeCount &&
      editorRef.current?.contains(sel.getRangeAt(0).commonAncestorContainer)

    if (rangeInEditor) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(after)
      range.insertNode(card)
      range.setStartAfter(after)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } else {
      editorRef.current?.appendChild(card)
      editorRef.current?.appendChild(after)
    }
    setHasContent(true)
    triggerAutoSave()
  }

  const applyFormat = ({ cmd, value }) => {
    editorRef.current?.focus()
    restoreSelection()

    if (cmd === 'formatBlock') {
      const current = document.queryCommandValue('formatBlock').toLowerCase()
      const target = (value || '').toLowerCase()
      // 같은 블록 포맷이면 p로 되돌리기
      document.execCommand('formatBlock', false, current === target ? 'p' : value)
    } else if (cmd === 'justifyLeft' || cmd === 'justifyCenter' || cmd === 'justifyRight') {
      const alreadyActive = document.queryCommandState(cmd)
      if (alreadyActive && cmd !== 'justifyLeft') {
        document.execCommand('justifyLeft', false, null)
        setTextAlign('left')
      } else {
        document.execCommand(cmd, false, null)
        if (cmd === 'justifyLeft') setTextAlign('left')
        else if (cmd === 'justifyCenter') setTextAlign('center')
        else if (cmd === 'justifyRight') setTextAlign('right')
      }
    } else {
      document.execCommand(cmd, false, value ?? null)
    }
  }

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const img = new Image()
        img.onload = () => {
          const MAX = 800
          const scale = Math.min(1, MAX / Math.max(img.width, img.height))
          const canvas = document.createElement('canvas')
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
          const compressed = canvas.toDataURL('image/jpeg', 0.75)
          editorRef.current?.focus()
          document.execCommand('insertHTML', false, `<img src="${compressed}" style="max-width:100%;border-radius:0px;margin:8px 0;display:block;" />`)
          setHasContent(true)
          triggerAutoSave()
        }
        img.src = ev.target.result
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--dialog-bg)' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <button
          onClick={() => {
            if (!isEdit && (title.trim() || editorRef.current?.innerText?.trim())) {
              setShowCancelDialog(true)
            } else {
              navigate(-1)
            }
          }}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          취소
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{
              background: 'transparent',
              color: '#9ca3af',
            }}
          >
            {isPop ? 'Bubble Pop' : 'Bubble Log'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
            title={visibility === 'public' ? '전체공개' : '나만보기'}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: '#9ca3af' }}
          >
            {visibility === 'public' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path d="M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 0c-2.5 3-4 6.5-4 10s1.5 7 4 10m0-20c2.5 3 4 6.5 4 10s-1.5 7-4 10M2 12h20" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <rect x="5" y="11" width="14" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round"/>
              </svg>
            )}
          </button>
          <button
            onClick={handleSubmit}
            className="text-sm font-semibold text-gray-800 hover:text-gray-500 transition-colors disabled:text-gray-300"
            disabled={!title.trim() || (isPop && expiry === 'custom' && !customDate)}
          >
            {isEdit ? '저장' : '올리기'}
          </button>
        </div>
      </div>

      {/* Pop 만료 시간 선택 */}
      {isPop && !isEdit && (
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs text-gray-400 flex-shrink-0">삭제까지</span>
          {[
            { label: '10분', ms: 10 * 60 * 1000 },
            { label: '30분', ms: 30 * 60 * 1000 },
            { label: '1시간', ms: 60 * 60 * 1000 },
            { label: '3시간', ms: 3 * 60 * 60 * 1000 },
            { label: '12시간', ms: 12 * 60 * 60 * 1000 },
            { label: '24시간', ms: 24 * 60 * 60 * 1000 },
            { label: '48시간', ms: 48 * 60 * 60 * 1000 },
            { label: '일주일', ms: 7 * 24 * 60 * 60 * 1000 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => { setExpiry(opt.ms); setCustomDate('') }}
              className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors"
              style={{
                background: expiry === opt.ms ? 'rgba(30,30,30,0.85)' : 'var(--input-bg)',
                color: expiry === opt.ms ? 'rgba(255,255,255,0.9)' : '#9ca3af',
                fontWeight: expiry === opt.ms ? 600 : 500,
              }}
            >
              {opt.label}
            </button>
          ))}

          {/* 직접 설정 */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setExpiry('custom')}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
              style={{
                background: expiry === 'custom' ? 'rgba(30,30,30,0.85)' : 'rgba(0,0,0,0.04)',
                color: expiry === 'custom' ? 'rgba(255,255,255,0.9)' : '#9ca3af',
                fontWeight: expiry === 'custom' ? 600 : 500,
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <rect x="1" y="2" width="14" height="13" rx="2"/>
                <path d="M1 6h14M5 1v2M11 1v2" strokeLinecap="round"/>
              </svg>
              {expiry === 'custom' && customDate
                ? new Date(customDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '직접 설정'}
            </button>
            <input
              ref={dateInputRef}
              type="datetime-local"
              value={customDate}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={(e) => { setCustomDate(e.target.value); setExpiry('custom') }}
              onClick={() => setExpiry('custom')}
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ accentColor: '#6b7280' }}
            />
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex-1 px-5 pt-6 flex flex-col pb-20">
        {/* 태그 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3" style={{ justifyContent: textAlign === 'right' ? 'flex-end' : textAlign === 'center' ? 'center' : 'flex-start', minHeight: '26px' }}>
          {tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'var(--input-bg)', color: '#6b7280' }}
            >
              #{tag}
              <button
                onClick={() => handleTagsChange(tags.filter((t) => t !== tag))}
                className="leading-none text-gray-400 hover:text-gray-600"
              >×</button>
            </span>
          ))}
          {tags.length < 10 && (
            <div className="flex items-center gap-0.5">
              <span className="text-xs text-gray-300 font-semibold">#</span>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value.slice(0, 20))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') e.preventDefault()
                }}
                onKeyUp={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    const t = tagInput.trim().replace(/,$/, '').slice(0, 20)
                    if (t && !tags.includes(t) && tags.length < 10) handleTagsChange([...tags, t])
                    tagJustAddedRef.current = true
                    setTagInput('')
                  }
                }}
                onBlur={() => {
                  if (tagJustAddedRef.current) { tagJustAddedRef.current = false; return }
                  const t = tagInput.trim().replace(/,$/, '')
                  if (t && !tags.includes(t) && tags.length < 10) handleTagsChange([...tags, t])
                  setTagInput('')
                }}
                placeholder="태그 추가"
                className="text-xs text-gray-500 placeholder-gray-300 bg-transparent focus:outline-none"
                style={{ width: `${Math.max(44, tagInput.length * 9 + 24)}px` }}
              />
            </div>
          )}
        </div>

        {/* 제목 */}
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={handleTitleChange}
          maxLength={50}
          className="w-full font-bold text-gray-800 placeholder-gray-300 bg-transparent focus:outline-none leading-tight mb-5"
          style={{ fontSize: '26px', textAlign }}
        />

        <div className="h-px bg-gray-100 mb-5" />

        {/* 에디터 */}
        <div className="relative flex-1">
          {!hasContent && (
            <p className="absolute top-0 left-0 right-0 text-sm text-gray-300 pointer-events-none select-none leading-relaxed" style={{ textAlign }}>
              내용을 입력하세요...
            </p>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onPaste={handlePaste}
            onPointerDown={handleEditorPointerDown}
            onClick={handleEditorClick}
            onKeyDown={(e) => { if (e.key === 'Escape') { setMentionQuery(null); setMentionResults([]) } }}
            className="write-editor min-h-64 w-full text-sm text-gray-700 bg-transparent focus:outline-none leading-[1.85]"
          />
        </div>
      </div>

      {/* 키보드 위 고정 툴바 */}
      <div
        ref={toolbarRef}
        className="fixed bottom-0 left-0 right-0 z-50 relative"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--divider)',
          boxShadow: 'var(--nav-shadow-top)',
          willChange: 'transform',
        }}
      >
        {mentionResults.length > 0 && (
          <MentionDropdown results={mentionResults} onSelect={insertMentionInEditor} />
        )}
        {showSizePicker && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {FONT_SIZES.map(({ label, size }) => (
              <button
                key={size}
                onPointerDown={(e) => { e.preventDefault(); applyFontSize(size) }}
                className="flex-shrink-0 px-3.5 py-1.5 rounded-xl transition-colors"
                style={{
                  fontSize: `${size}px`,
                  lineHeight: 1,
                  background: 'transparent',
                  color: activeFontSize === size ? '#1f2937' : '#9ca3af',
                  fontWeight: activeFontSize === size ? 700 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {showColorPicker && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {COLORS.map(({ color, label }) => (
              <button
                key={color}
                title={label}
                onPointerDown={(e) => { e.preventDefault(); applyColor(color) }}
                className="flex-shrink-0 w-7 h-7 rounded-full transition-transform active:scale-90"
                style={{
                  background: color,
                  boxShadow: activeColor === color ? `0 0 0 2px white, 0 0 0 3.5px ${color}` : 'none',
                }}
              />
            ))}
            <div className="relative flex-shrink-0 w-7 h-7">
              <div
                className="w-7 h-7 rounded-full"
                style={{ background: 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' }}
              />
              <input
                type="color"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                value={activeColor}
                onChange={(e) => applyColor(e.target.value)}
              />
            </div>
          </div>
        )}
        {showMoreMenu && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-100 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TOOLBAR_MORE.map((t) => {
              const isActive = t.value
                ? activeFormats[t.value.toLowerCase()]
                : activeFormats[t.cmd]
              return (
                <button
                  key={t.title}
                  title={t.title}
                  onPointerDown={(e) => { e.preventDefault(); applyFormat(t); setShowMoreMenu(false) }}
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  style={{ ...t.style, background: isActive ? 'rgba(0,0,0,0.08)' : 'transparent', color: isActive ? '#1f2937' : '#6b7280' }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        )}
        <div className="flex items-center px-2 py-1.5 overflow-x-auto gap-0.5" style={{ scrollbarWidth: 'none' }}>
          <button
            title="이미지 첨부"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 active:bg-gray-100 active:text-gray-800 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
              <rect x="2" y="4" width="16" height="13" rx="2" />
              <circle cx="7" cy="9" r="1.5" />
              <path d="M2 13.5l4-4 3 3 3-3 6 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            title="글감 추가"
            onPointerDown={(e) => { e.preventDefault(); saveSelection(); setShowSourcePicker(true) }}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 active:bg-gray-100 active:text-gray-800 transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
              <path d="M10 3a7 7 0 1 1 0 14A7 7 0 0 1 10 3z"/>
              <path d="M10 7v6M7 10h6" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="w-px h-5 bg-gray-100 mx-1 flex-shrink-0" />
          <button
            title="글자 크기"
            onPointerDown={(e) => { e.preventDefault(); saveSelection(); setShowSizePicker(v => !v); setShowColorPicker(false); setShowMoreMenu(false) }}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-colors"
            style={{ color: showSizePicker ? '#1f2937' : '#9ca3af', background: showSizePicker ? 'rgba(0,0,0,0.06)' : 'transparent' }}
          >
            <span className="font-bold leading-none" style={{ fontSize: '15px' }}>A</span>
            <span className="leading-none" style={{ fontSize: '9px' }}>SIZE</span>
          </button>
          <button
            title="글자 색상"
            onPointerDown={(e) => { e.preventDefault(); saveSelection(); setShowColorPicker(v => !v); setShowSizePicker(false); setShowMoreMenu(false) }}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 text-gray-500 active:bg-gray-100 transition-colors"
          >
            <span className="text-sm font-bold leading-none" style={{ color: activeColor }}>A</span>
            <div className="w-4 h-1 rounded-full" style={{ background: activeColor }} />
          </button>
          <div className="w-px h-5 bg-gray-100 mx-1 flex-shrink-0" />
          {TOOLBAR.map((t) => {
            const isActive = activeFormats[t.cmd]
            return (
            <button
              key={t.title}
              title={t.title}
              onPointerDown={(e) => { e.preventDefault(); applyFormat(t) }}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ ...t.style, background: isActive ? 'rgba(0,0,0,0.08)' : 'transparent', color: isActive ? '#1f2937' : '#6b7280' }}
            >
              {t.label}
            </button>
          )})}
          <div className="w-px h-5 bg-gray-100 mx-1 flex-shrink-0" />
          <button
            title="더 보기"
            onPointerDown={(e) => { e.preventDefault(); saveSelection(); setShowMoreMenu(v => !v); setShowColorPicker(false) }}
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: showMoreMenu ? '#1f2937' : '#9ca3af', background: showMoreMenu ? 'rgba(0,0,0,0.06)' : 'transparent' }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <circle cx="4" cy="10" r="1.5"/>
              <circle cx="10" cy="10" r="1.5"/>
              <circle cx="16" cy="10" r="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* 취소 확인 다이얼로그 */}
      {showCancelDialog && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.3)' }}
          onClick={() => setShowCancelDialog(false)}
        >
          <div
            className="w-full max-w-md mb-6 mx-4 rounded-2xl overflow-hidden"
            style={{ background: 'var(--menu-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 text-center">
              <p className="text-sm font-semibold text-gray-800">임시저장할까요?</p>
              <p className="text-xs text-gray-400 mt-1">나중에 이어서 쓸 수 있어요</p>
            </div>
            <div className="h-px bg-gray-100 mx-4" />
            <button
              onClick={() => {
                const currentContent = editorRef.current?.innerHTML ?? ''
                const contentText = editorRef.current?.innerText?.trim() ?? ''
                if (title.trim() || contentText) {
                  saveDraft({
                    id: sessionDraftId.current,
                    type,
                    title,
                    content: currentContent,
                    tags,
                    savedAt: Date.now(),
                  })
                }
                setShowCancelDialog(false)
                navigate(-1)
              }}
              className="w-full py-3.5 text-sm font-semibold text-gray-400 hover:bg-gray-50 transition-colors"
            >
              임시저장
            </button>
            <div className="h-px bg-gray-100 mx-4" />
            <button
              onClick={() => {
                sessionStorage.removeItem(SESSION_KEY)
                sessionStorage.removeItem(`${SESSION_KEY}_snap`)
                deleteDraft(sessionDraftId.current)
                setShowCancelDialog(false)
                navigate(-1)
              }}
              className="w-full py-3.5 text-sm font-medium text-red-400 hover:bg-gray-50 transition-colors"
            >
              삭제
            </button>
            <div className="h-px bg-gray-100 mx-4" />
            <button
              onClick={() => setShowCancelDialog(false)}
              className="w-full py-3.5 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              계속 쓰기
            </button>
          </div>
        </div>
      )}

      {showSourcePicker && (
        <SourcePicker
          onSelect={insertSourceInEditor}
          onClose={() => setShowSourcePicker(false)}
        />
      )}

    </div>
  )
}
