import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { usePosts } from '../context/PostsContext'
import { useDraft } from '../context/DraftContext'

const TOOLBAR = [
  { label: 'B',   title: 'Bold',          cmd: 'bold',          style: { fontWeight: 800, fontSize: '14px' } },
  { label: 'I',   title: 'Italic',        cmd: 'italic',        style: { fontStyle: 'italic', fontSize: '14px' } },
  { label: 'U',   title: 'Underline',     cmd: 'underline',     style: { textDecoration: 'underline', fontSize: '14px' } },
  { label: 'S',   title: 'Strikethrough', cmd: 'strikethrough', style: { textDecoration: 'line-through', fontSize: '13px' } },
  { label: 'H1',  title: 'Heading 1',     cmd: 'formatBlock',   value: 'h1', style: { fontWeight: 800, fontSize: '11px', letterSpacing: '-0.02em' } },
  { label: 'H2',  title: 'Heading 2',     cmd: 'formatBlock',   value: 'h2', style: { fontWeight: 700, fontSize: '11px', letterSpacing: '-0.02em' } },
  { label: <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-4 h-4"><line x1="4" y1="4" x2="4" y2="16" strokeWidth="2.5" strokeLinecap="round"/><line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="10" x2="16" y2="10" strokeWidth="1.5" strokeLinecap="round"/><line x1="8" y1="14" x2="16" y2="14" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: 'Quote', cmd: 'formatBlock', value: 'blockquote', style: {} },
  { label: '―',  title: 'Divider',       cmd: 'insertHorizontalRule', style: { fontSize: '16px', lineHeight: 1 } },
]

export default function Write() {
  const { type, id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { posts, addPost, updatePost } = usePosts()
  const { drafts, saveDraft, deleteDraft } = useDraft()

  const isEdit = !!id
  const editPost = isEdit ? posts.find((p) => String(p.id) === id) : null

  const [title, setTitle] = useState(editPost?.title ?? '')
  const [tags, setTags] = useState(editPost?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [hasContent, setHasContent] = useState(!!editPost?.content)
  const [images] = useState([])
  const [expiry, setExpiry] = useState(60 * 60 * 1000) // 기본 1시간 (ms)
  const [customDate, setCustomDate] = useState('')
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [visibility, setVisibility] = useState(editPost?.visibility ?? 'public')
  const editorRef = useRef(null)
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)
  const debounceRef = useRef(null)

  const isPop = editPost ? editPost.type === 'pop' : type === 'pop'
  const toolbarRef = useRef(null)

  // 세션마다 고유 draftId (Me탭에서 이어쓰기 진입 시 기존 ID 유지)
  const sessionDraftId = useRef(location.state?.draftId ?? `draft_${type}_${Date.now()}`)

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
    el.addEventListener('focus', () => el.classList.add('focused'))
    el.addEventListener('blur', () => el.classList.remove('focused'))
  }, [])

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
  }

  const handleEditorClick = (e) => {
    if (e.target.tagName === 'IMG') {
      const img = e.target
      img.style.borderRadius = img.style.borderRadius === '12px' ? '0px' : '12px'
    }
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
      deleteDraft(sessionDraftId.current)
      if (newPost) navigate(`/post/${newPost.id}`, { replace: true })
    }
  }

  const applyFormat = ({ cmd, value }) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value ?? null)
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
        <button
          onClick={handleSubmit}
          className="text-sm font-semibold text-gray-800 hover:text-gray-500 transition-colors disabled:text-gray-300"
          disabled={!title.trim() || (isPop && expiry === 'custom' && !customDate)}
        >
          {isEdit ? '저장' : '올리기'}
        </button>
      </div>

      {/* 공개 범위 */}
      <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2">
        {[
          { value: 'public', label: '전체공개', icon: 'M12 2a10 10 0 1 1 0 20A10 10 0 0 1 12 2zm0 0c-2.5 3-4 6.5-4 10s1.5 7 4 10m0-20c2.5 3 4 6.5 4 10s-1.5 7-4 10M2 12h20' },
          { value: 'private', label: '나만보기', icon: 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-2c0 3.5-2.7 6-6 6s-6-2.5-6-6 2.7-6 6-6 6 2.5 6 6zM3 3l18 18' },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setVisibility(opt.value)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              background: visibility === opt.value ? 'rgba(30,30,30,0.85)' : 'var(--input-bg)',
              color: visibility === opt.value ? 'rgba(255,255,255,0.9)' : '#9ca3af',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3">
              <path d={opt.icon} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {opt.label}
          </button>
        ))}
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
              onClick={() => { setExpiry('custom'); dateInputRef.current?.showPicker?.() }}
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
              className="absolute inset-0 opacity-0 cursor-pointer"
              style={{ accentColor: '#6b7280' }}
            />
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="flex-1 px-5 pt-7 flex flex-col pb-20" style={{ gap: '0' }}>
        {/* 태그 */}
        <div className="flex flex-wrap items-center gap-1.5 mb-5">
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
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                    e.preventDefault()
                    const t = tagInput.trim().replace(/,$/, '')
                    if (t && !tags.includes(t) && tags.length < 10) handleTagsChange([...tags, t])
                    setTagInput('')
                  }
                }}
                onBlur={() => {
                  const t = tagInput.trim().replace(/,$/, '')
                  if (t && !tags.includes(t) && tags.length < 10) handleTagsChange([...tags, t])
                  setTagInput('')
                }}
                placeholder="태그 추가"
                className="text-xs text-gray-500 placeholder-gray-300 bg-transparent focus:outline-none w-16"
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
          className="w-full font-extrabold text-gray-800 placeholder-gray-200 bg-transparent focus:outline-none mb-5 leading-tight"
          style={{ fontSize: '26px' }}
        />

        {/* 구분선 */}
        <div className="h-px bg-gray-100 mb-5" />

        {/* 에디터 */}
        <div className="relative flex-1">
          {!hasContent && (
            <p className="absolute top-0 left-0 text-sm text-gray-300 pointer-events-none select-none leading-relaxed">
              내용을 입력하세요...
            </p>
          )}
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onClick={handleEditorClick}
            className="write-editor min-h-64 w-full text-sm text-gray-700 bg-transparent focus:outline-none leading-relaxed"
          />
        </div>

        {/* 첨부 이미지 미리보기 */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4">
            {images.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img.url} alt={img.name} className="w-24 h-24 object-cover rounded-xl border border-gray-100" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white text-xs flex items-center justify-center"
                >×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 키보드 위 고정 툴바 */}
      <div
        ref={toolbarRef}
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--nav-bg)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--divider)',
          boxShadow: 'var(--nav-shadow-top)',
          willChange: 'transform',
        }}
      >
        <div className="flex items-center px-2 py-1.5 overflow-x-auto gap-0.5">
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
          <div className="w-px h-5 bg-gray-100 mx-1 flex-shrink-0" />
          {TOOLBAR.map((t) => (
            <button
              key={t.title}
              title={t.title}
              onPointerDown={(e) => { e.preventDefault(); applyFormat(t) }}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 active:bg-gray-100 active:text-gray-800 transition-colors"
              style={t.style}
            >
              {t.label}
            </button>
          ))}
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
    </div>
  )
}
