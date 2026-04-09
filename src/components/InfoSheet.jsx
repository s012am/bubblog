export default function InfoSheet({ onClose, avatar, name, bio, bubbles, log, pop, followers, followings, onFollowersClick, onFollowingsClick, profileUrl }) {
  function Stat({ value, label, onClick }) {
    const content = (
      <>
        <span className="text-xl font-bold text-gray-800">{value}</span>
        <span className="text-xs text-gray-400">{label}</span>
      </>
    )
    return onClick
      ? <button className="flex flex-col gap-0.5 items-center" onClick={onClick}>{content}</button>
      : <div className="flex flex-col gap-0.5 items-center">{content}</div>
  }

  function FollowStat({ value, label, onClick }) {
    const content = (
      <span className="text-xs text-gray-500">
        <span className="font-bold text-gray-800">{value}</span>
        {' '}{label}
      </span>
    )
    return onClick
      ? <button onClick={onClick}>{content}</button>
      : <span>{content}</span>
  }

  const Divider = () => <div className="w-px h-8 bg-gray-100" />

  return (
    <div
      className="fixed inset-0 z-40 flex items-end"
      style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl px-6 pt-5 pb-24 flex flex-col gap-4"
        style={{ background: 'var(--sheet-bg)', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background: 'var(--avatar-bg)' }}>
            {avatar
              ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-base font-bold text-gray-400">{name[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <p className="font-bold text-gray-800">{name}</p>
            <div className="flex items-center gap-2.5">
              <FollowStat value={followers} label="Followers" onClick={onFollowersClick} />
              <span className="text-gray-200 text-xs">·</span>
              <FollowStat value={followings} label="Followings" onClick={onFollowingsClick} />
            </div>
            {bio && <p className="text-xs text-gray-400">{bio}</p>}
          </div>
          <button
            onClick={() => {
              const url = profileUrl || window.location.href
              if (navigator.share) navigator.share({ title: name, url })
              else navigator.clipboard.writeText(url)
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            style={{ border: '1px solid rgba(0,0,0,0.08)' }}
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
              <circle cx="12" cy="3" r="1.8"/><circle cx="4" cy="8" r="1.8"/><circle cx="12" cy="13" r="1.8"/>
              <path d="M5.8 9l4.4 2.5M10.2 4.5L5.8 7" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="h-px bg-gray-100" />
        <div className="flex items-center">
          <div className="flex-1 flex justify-center"><Stat value={bubbles} label="Bubbles" /></div>
          <Divider />
          <div className="flex-1 flex justify-center"><Stat value={log} label="Logs" /></div>
          <Divider />
          <div className="flex-1 flex justify-center"><Stat value={pop} label="Pops" /></div>
        </div>
      </div>
    </div>
  )
}
