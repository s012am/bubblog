const TYPE_LABELS = {
  music: '음악',
  book: '책',
  movie: '영화',
  drama: '드라마',
  anime: '애니',
}

const TYPE_ICONS = {
  music: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <circle cx="7" cy="7" r="5.5"/>
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" opacity="0.4"/>
      <path d="M7 1.5v5.5" strokeLinecap="round"/>
    </svg>
  ),
  book: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M3 2h6.5a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" strokeLinecap="round"/>
      <path d="M5 2v10.5" strokeLinecap="round"/>
    </svg>
  ),
  movie: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <rect x="1" y="3" width="12" height="9" rx="1.5"/>
      <path d="M1 6h12M4 3v3M7 3v3M10 3v3M4 9v3M7 9v3M10 9v3" strokeLinecap="round"/>
    </svg>
  ),
  drama: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <rect x="1" y="4" width="12" height="8" rx="1.5"/>
      <path d="M5 1.5l2 2.5 2-2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  anime: (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
      <path d="M7 1.5l1.6 3.3 3.6.5-2.6 2.5.6 3.6L7 9.6 4.8 11.4l.6-3.6L2.8 5.3l3.6-.5L7 1.5z" strokeLinejoin="round"/>
    </svg>
  ),
}

function CoverImage({ cover, title, size }) {
  if (cover) {
    return (
      <img
        src={cover}
        alt={title}
        className={`${size} rounded-xl object-cover flex-shrink-0`}
        onError={(e) => {
          e.target.style.display = 'none'
          e.target.nextSibling.style.display = 'flex'
        }}
      />
    )
  }
  return (
    <div className={`${size} rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0`}>
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-gray-300">
        <rect x="3" y="3" width="14" height="14" rx="2"/>
      </svg>
    </div>
  )
}

export default function SourceCard({ source, compact = false }) {
  if (!source) return null

  const label = TYPE_LABELS[source.type] || source.type
  const icon = TYPE_ICONS[source.type] || null

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
        style={{ background: 'var(--input-bg, #f3f4f6)' }}
      >
        {source.cover ? (
          <img
            src={source.cover}
            alt={source.title}
            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-gray-200 flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-600 truncate leading-tight">{source.title}</p>
          {(source.creator || source.year) && (
            <p className="text-xs text-gray-400 truncate leading-tight">
              {[source.creator, source.year].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <span
          className="flex items-center gap-0.5 text-gray-400 flex-shrink-0"
          style={{ fontSize: '10px' }}
        >
          {icon}
          {label}
        </span>
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: 'var(--input-bg, #f3f4f6)' }}
    >
      {source.cover ? (
        <>
          <img
            src={source.cover}
            alt={source.title}
            className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 items-center justify-center" style={{ display: 'none' }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-300">
              <rect x="3" y="3" width="14" height="14" rx="2"/>
            </svg>
          </div>
        </>
      ) : (
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-gray-300">
            <rect x="3" y="3" width="14" height="14" rx="2"/>
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{source.title}</p>
        {source.creator && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{source.creator}</p>
        )}
        {source.year && (
          <p className="text-xs text-gray-400">{source.year}</p>
        )}
      </div>
      <span
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 flex-shrink-0"
        style={{ fontSize: '11px', background: 'rgba(0,0,0,0.04)' }}
      >
        {icon}
        {label}
      </span>
    </div>
  )
}
