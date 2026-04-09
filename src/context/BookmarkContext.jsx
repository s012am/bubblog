import { createContext, useContext, useState } from 'react'

const BookmarkContext = createContext(null)
export const useBookmark = () => useContext(BookmarkContext)

const STORAGE_KEY = 'bubblog_bookmarks'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(load)

  const toggleBookmark = (id) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const isBookmarked = (id) => bookmarks.includes(id)

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  )
}
