import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const NotificationContext = createContext(null)
export const useNotification = () => useContext(NotificationContext)

const NOTIF_SELECT = `
  id, type, post_id, comment_id, read, created_at,
  actor:actor_id (id, username, nickname, avatar_url),
  post:post_id (title),
  comment:comment_id (content)
`

const PREFS_KEY = 'bubblog_notif_prefs'
const DEFAULT_PREFS = { like: true, rebubble: true, follow: true, comment: true, reply: true }

function loadPrefs() {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') } }
  catch { return { ...DEFAULT_PREFS } }
}

function mapNotif(raw) {
  return {
    id: raw.id,
    type: raw.type,
    postId: raw.post_id,
    postTitle: raw.post?.title || '',
    commentText: raw.comment?.content || '',
    read: raw.read,
    createdAt: raw.created_at,
    actor: raw.actor || null,
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [prefs, setPrefs] = useState(loadPrefs)
  const channelRef = useRef(null)

  const updatePref = (key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(PREFS_KEY, JSON.stringify(next))
      return next
    })
  }

  // 로그인 상태 감지
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data?.session?.user?.id || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserId(session?.user?.id || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchNotifications = useCallback(async (userId) => {
    if (!userId) { setNotifications([]); return }
    const { data, error } = await supabase
      .from('notifications')
      .select(NOTIF_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (!error && data) setNotifications(data.map(mapNotif))
  }, [])

  // 유저 변경시 알림 로드 + Realtime 구독
  useEffect(() => {
    fetchNotifications(currentUserId)

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    if (!currentUserId) return

    const channel = supabase
      .channel(`notifications:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('notifications')
            .select(NOTIF_SELECT)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            const notif = mapNotif(data)
            const currentPrefs = loadPrefs()
            if (currentPrefs[notif.type] !== false) {
              setNotifications((prev) => [notif, ...prev])
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [currentUserId, fetchNotifications])

  const visibleNotifications = notifications.filter((n) => prefs[n.type] !== false)
  const unreadCount = visibleNotifications.filter((n) => !n.read).length

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    await supabase.from('notifications').update({ read: true }).eq('id', id)
  }

  async function markAllRead() {
    if (!currentUserId) return
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', currentUserId).eq('read', false)
  }

  async function deleteNotification(id) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  return (
    <NotificationContext.Provider value={{ notifications: visibleNotifications, unreadCount, markRead, markAllRead, deleteNotification, prefs, updatePref }}>
      {children}
    </NotificationContext.Provider>
  )
}
