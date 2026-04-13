export default function MentionDropdown({ results, onSelect }) {
  if (!results.length) return null
  return (
    <div
      className="absolute left-0 right-0 bottom-full mb-1.5 rounded-2xl overflow-hidden z-50"
      style={{ background: 'var(--dropdown-bg)', backdropFilter: 'blur(16px)', boxShadow: '0 -4px 20px rgba(0,0,0,0.12)', border: '1px solid var(--divider)' }}
    >
      {results.map((u) => {
        const name = u.nickname || u.username
        return (
          <button
            key={u.username}
            onMouseDown={(e) => { e.preventDefault(); onSelect(u.username) }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--avatar-bg)' }}>
              {u.avatar_url
                ? <img src={u.avatar_url} alt={name} className="w-full h-full object-cover" />
                : <span className="text-xs font-bold text-gray-500">{name[0]?.toUpperCase()}</span>}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-700 truncate">{name}</p>
              <p className="text-xs text-gray-400">@{u.username}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
