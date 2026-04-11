import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const FollowContext = createContext(null)

export function FollowProvider({ children }) {
  const [following, setFollowing] = useState([]) // usernames
  const [currentUserId, setCurrentUserId] = useState(null)
  const [followVersion, setFollowVersion] = useState(0)

  const fetchFollowing = useCallback(async (userId) => {
    const { data: rows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (!rows || rows.length === 0) { setFollowing([]); return }

    const ids = rows.map(r => r.following_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('username')
      .in('id', ids)

    setFollowing((profiles || []).map(p => p.username))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setCurrentUserId(session.user.id); fetchFollowing(session.user.id) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setCurrentUserId(session.user.id); fetchFollowing(session.user.id) }
      else { setCurrentUserId(null); setFollowing([]) }
    })

    return () => subscription.unsubscribe()
  }, [fetchFollowing])

  const follow = async (username) => {
    if (!currentUserId) return
    const { data: target } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!target) return

    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: target.id })
    setFollowing(prev => prev.includes(username) ? prev : [...prev, username])
    setFollowVersion(v => v + 1)
  }

  const unfollow = async (username) => {
    if (!currentUserId) return
    const { data: target } = await supabase
      .from('profiles').select('id').eq('username', username).single()
    if (!target) return

    await supabase.from('follows').delete()
      .eq('follower_id', currentUserId)
      .eq('following_id', target.id)
    setFollowing(prev => prev.filter(n => n !== username))
    setFollowVersion(v => v + 1)
  }

  const isFollowing = (username) => following.includes(username)

  return (
    <FollowContext.Provider value={{ following, follow, unfollow, isFollowing, followVersion }}>
      {children}
    </FollowContext.Provider>
  )
}

export function useFollow() {
  return useContext(FollowContext)
}
