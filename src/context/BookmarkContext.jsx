import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const BookmarkContext = createContext(null)
export const useBookmark = () => useContext(BookmarkContext)

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]) // post ids (as strings)
  const [currentUserId, setCurrentUserId] = useState(null)

  const fetchBookmarks = useCallback(async (userId) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId)

    setBookmarks((data || []).map(b => String(b.post_id)))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setCurrentUserId(session.user.id); fetchBookmarks(session.user.id) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setCurrentUserId(session.user.id); fetchBookmarks(session.user.id) }
      else { setCurrentUserId(null); setBookmarks([]) }
    })

    return () => subscription.unsubscribe()
  }, [fetchBookmarks])

  const toggleBookmark = async (postId) => {
    if (!currentUserId) return
    const id = String(postId)
    const already = bookmarks.includes(id)

    if (already) {
      await supabase.from('bookmarks').delete()
        .eq('post_id', postId)
        .eq('user_id', currentUserId)
      setBookmarks(prev => prev.filter(b => b !== id))
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: currentUserId })
      setBookmarks(prev => [...prev, id])
    }
  }

  const isBookmarked = (postId) => bookmarks.includes(String(postId))

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  )
}
