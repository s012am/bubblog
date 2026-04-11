import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const NotificationContext = createContext(null)
export const useNotification = () => useContext(NotificationContext)

const NOTIF_SELECT = `
  id, type, post_id, post_title, comment_text, read, created_at,
  actor:actor_id (id, username, nickname, avatar_url)
`

function mapNotif(raw) {
  return {
    id: raw.id,
    type: raw.type,
    postId: raw.post_id,
    postTitle: raw.post_title,
    commentText: raw.comment_text,
    read: raw.read,
    createdAt: raw.created_at,
    actor: raw.actor || null,
  }
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const channelRef = useRef(null)

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

    // 이전 채널 정리
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
          // 새 알림: actor 정보 포함해서 다시 fetch
          const { data } = await supabase
            .from('notifications')
            .select(NOTIF_SELECT)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setNotifications((prev) => [mapNotif(data), ...prev])
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

  const unreadCount = notifications.filter((n) => !n.read).length

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
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}
