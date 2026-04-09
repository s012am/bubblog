import { createContext, useContext, useState } from 'react'

const NotificationContext = createContext(null)
export const useNotification = () => useContext(NotificationContext)

const STORAGE_KEY = 'bubblog_notifications'

const SEED = [
  { id: 'n1', type: 'follow', from: 'minjun', date: Date.now() - 1000 * 60 * 60 * 26, read: false },
  { id: 'n2', type: 'like', from: 'soyeon', postTitle: '첫 번째 글', date: Date.now() - 1000 * 60 * 60 * 20, read: false },
  { id: 'n3', type: 'rebubble', from: 'haewon', postTitle: '첫 번째 글', date: Date.now() - 1000 * 60 * 60 * 14, read: true },
  { id: 'n4', type: 'comment', from: 'minjun', postTitle: '두 번째 글', commentText: '좋은 글이에요!', date: Date.now() - 1000 * 60 * 60 * 5, read: false },
  { id: 'n5', type: 'like', from: 'haewon', postTitle: '두 번째 글', date: Date.now() - 1000 * 60 * 30, read: false },
]

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED))
  return SEED
}

function save(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(load)

  const unreadCount = notifications.filter((n) => !n.read).length

  function addNotification(n) {
    setNotifications((prev) => {
      const next = [n, ...prev]
      save(next)
      return next
    })
  }

  function markRead(id) {
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, read: true } : n)
      save(next)
      return next
    })
  }

  function markAllRead() {
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, read: true }))
      save(next)
      return next
    })
  }

  function deleteNotification(id) {
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id)
      save(next)
      return next
    })
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, deleteNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}
