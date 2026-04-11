import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DraftContext = createContext(null)
export const useDraft = () => useContext(DraftContext)

export function DraftProvider({ children }) {
  const [drafts, setDrafts] = useState([])
  const [userId, setUserId] = useState(null)

  // Get current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Fetch drafts when userId changes
  const fetchDrafts = useCallback(async (uid) => {
    if (!uid) { setDrafts([]); return }
    const { data } = await supabase
      .from('drafts')
      .select('*')
      .eq('user_id', uid)
      .order('saved_at', { ascending: false })
    setDrafts(data || [])
  }, [])

  useEffect(() => {
    fetchDrafts(userId)
  }, [userId, fetchDrafts])

  const saveDraft = async (draft) => {
    // draft: { id, type, title, content, tags }
    if (!userId) return
    const row = {
      id: draft.id,
      user_id: userId,
      type: draft.type || 'log',
      title: draft.title || '',
      content: draft.content || '',
      tags: draft.tags || [],
      saved_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('drafts').upsert(row).select().single()
    if (error) { console.error('saveDraft error', error); return }
    setDrafts(prev => {
      const filtered = prev.filter(d => d.id !== draft.id)
      return [data, ...filtered]
    })
  }

  const deleteDraft = async (id) => {
    if (!userId) return
    await supabase.from('drafts').delete().eq('id', id).eq('user_id', userId)
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  return (
    <DraftContext.Provider value={{ drafts, saveDraft, deleteDraft }}>
      {children}
    </DraftContext.Provider>
  )
}
