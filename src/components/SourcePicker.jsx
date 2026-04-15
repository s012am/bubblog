import { useState, useEffect, useRef } from 'react'
import { searchMusic, searchBook, searchLocal, searchDict } from '../lib/sourceSearch'

const CATEGORIES = [
  { key: 'music', label: '음악', search: searchMusic },
  { key: 'book',  label: '책',   search: searchBook },
  { key: 'local', label: '장소', search: searchLocal },
  { key: 'dict',  label: '사전', search: searchDict },
]

function CoverFallback({ type }) {
  const icons = {
    music: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400">
        <circle cx="10" cy="10" r="8"/>
        <circle cx="10" cy="10" r="2.5" fill="currentColor" stroke="none" opacity="0.3"/>
        <path d="M10 2v8" strokeLinecap="round"/>
      </svg>
    ),
    book: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400">
        <path d="M4 3h9a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" strokeLinecap="round"/>
        <path d="M7 3v13" strokeLinecap="round"/>
      </svg>
    ),
    local: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400">
        <path d="M10 2a5 5 0 0 1 5 5c0 3.5-5 11-5 11S5 10.5 5 7a5 5 0 0 1 5-5z" strokeLinejoin="round"/>
        <circle cx="10" cy="7" r="1.8" fill="currentColor" stroke="none" opacity="0.35"/>
      </svg>
    ),
    dict: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-400">
        <path d="M4 2h9l3 3v13H4V2z" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M13 2v3h3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 8h6M7 11h6M7 14h4" strokeLinecap="round"/>
      </svg>
    ),
  }
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      {icons[type] || null}
    </div>
  )
}

export default function SourcePicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('music')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 1) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      const cat = CATEGORIES.find(c => c.key === activeCategory)
      if (!cat) return
      setLoading(true)
      try {
        const data = await cat.search(query)
        setResults(data)
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, activeCategory])

  const handleCategoryChange = (key) => {
    setActiveCategory(key)
    setResults([])
  }

  const handleSelect = (item) => {
    onSelect({ type: activeCategory, ...item })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full flex flex-col rounded-t-3xl overflow-hidden"
        style={{ height: '85vh', background: 'var(--dialog-bg, #fff)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-800">글감 추가</h2>
          <button
            onMouseDown={(e) => { e.preventDefault(); onClose() }}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            style={{ background: 'var(--input-bg, #f3f4f6)' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onMouseDown={(e) => { e.preventDefault(); handleCategoryChange(cat.key) }}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                background: activeCategory === cat.key ? 'rgba(30,30,30,0.85)' : 'var(--input-bg, #f3f4f6)',
                color: activeCategory === cat.key ? 'rgba(255,255,255,0.9)' : '#6b7280',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="px-5 pb-3 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl"
            style={{ background: 'var(--input-bg, #f3f4f6)' }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 text-gray-400 flex-shrink-0">
              <circle cx="8.5" cy="8.5" r="5.5"/>
              <path d="M14.5 14.5L18 18" strokeLinecap="round"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`${CATEGORIES.find(c => c.key === activeCategory)?.label} 검색...`}
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 bg-transparent focus:outline-none"
              autoFocus
            />
            {query.length > 0 && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setQuery(''); setResults([]) }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && query.length >= 1 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm">검색 결과가 없어요</p>
            </div>
          )}

          {!loading && query.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <p className="text-sm">검색어를 입력해보세요</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((item, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(item) }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-2xl text-left transition-colors hover:bg-gray-50 active:bg-gray-100"
                >
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                    />
                  ) : null}
                  {!item.cover && <CoverFallback type={activeCategory} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {[item.creator, item.year].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
