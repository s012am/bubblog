import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePosts } from '../context/PostsContext'

export default function BlockedUsers() {
  const navigate = useNavigate()
  const { refreshBlockedIds } = usePosts()
  const [blockedUsers, setBlockedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlocked = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: rows } = await supabase
        .from('blocks')
        .select('blocked_id, profiles!blocks_blocked_id_fkey(username, nickname, avatar_url, bio)')
        .eq('blocker_id', user.id)
      setBlockedUsers((rows || []).map(r => ({
        id: r.blocked_id,
        username: r.profiles?.username || '',
        name: r.profiles?.nickname || r.profiles?.username || '',
        avatar: r.profiles?.avatar_url || null,
        bio: r.profiles?.bio || '',
      })))
      setLoading(false)
    }
    fetchBlocked()
  }, [])

  const handleUnblock = async (blockedId) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('blocks').delete().eq('blocker_id', user.id).eq('blocked_id', blockedId)
    setBlockedUsers(prev => prev.filter(u => u.id !== blockedId))
    refreshBlockedIds()
  }

  return (
    <div className="min-h-screen">
      <div
        className="flex items-center gap-3 px-4 pt-8 pb-5"
        style={{ borderBottom: '1px solid var(--divider)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="font-extrabold text-gray-800 tracking-tight" style={{ fontSize: '22px' }}>차단 목록</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <svg className="w-5 h-5 text-gray-300 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round"/>
            </svg>
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-16">차단한 사용자가 없습니다.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
            {blockedUsers.map((u, i) => (
              <div key={u.id}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--avatar-bg)' }}>
                    {u.avatar
                      ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                      : <span className="text-sm font-bold text-gray-500">{u.name[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    {u.username && <p className="text-xs text-gray-400">@{u.username}</p>}
                  </div>
                  <button
                    onClick={() => handleUnblock(u.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex-shrink-0"
                    style={{ background: 'var(--input-bg)', color: '#6b7280', border: '1px solid var(--divider)' }}
                  >
                    차단 해제
                  </button>
                </div>
                {i < blockedUsers.length - 1 && <div className="h-px bg-gray-100 mx-5" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
