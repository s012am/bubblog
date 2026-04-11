import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const FollowContext = createContext(null)

const mapProfile = (p) => ({
  name: p.nickname || p.username,
  username: p.username,
  avatar: p.avatar_url || null,
  bio: p.bio || '',
  linkTo: `/user/${p.username}`,
})

export function FollowProvider({ children }) {
  const [following, setFollowing] = useState([]) // usernames
  const [followedProfiles, setFollowedProfiles] = useState({}) // username → profile
  const [profilesLoaded, setProfilesLoaded] = useState(false)
  const [followerUsers, setFollowerUsers] = useState([])  // 나를 팔로우하는 사람들
  const [followingUsers, setFollowingUsers] = useState([]) // 내가 팔로우하는 사람들
  const [currentUserId, setCurrentUserId] = useState(null)
  const [followVersion, setFollowVersion] = useState(0)

  const fetchFollowing = useCallback(async (userId) => {
    const { data: rows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId)

    if (!rows || rows.length === 0) {
      setFollowing([])
      setFollowedProfiles({})
      setFollowingUsers([])
      setProfilesLoaded(true)
    } else {
      const ids = rows.map(r => r.following_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, nickname, avatar_url, bio')
        .in('id', ids)

      const map = {}
      ;(profiles || []).forEach(p => { map[p.username] = p })
      setFollowing((profiles || []).map(p => p.username))
      setFollowedProfiles(map)
      setFollowingUsers((profiles || []).map(mapProfile))
      setProfilesLoaded(true)
    }

    // 팔로워 목록도 함께 fetch
    const { data: fwrRows } = await supabase
      .from('follows').select('follower_id').eq('following_id', userId)
    if (fwrRows?.length > 0) {
      const { data: fps } = await supabase
        .from('profiles').select('username, nickname, avatar_url, bio')
        .in('id', fwrRows.map(r => r.follower_id))
      setFollowerUsers((fps || []).map(mapProfile))
    } else {
      setFollowerUsers([])
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setCurrentUserId(session.user.id); fetchFollowing(session.user.id) }
      else { setProfilesLoaded(true) }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) { setCurrentUserId(session.user.id); fetchFollowing(session.user.id) }
      else { setCurrentUserId(null); setFollowing([]); setFollowedProfiles({}); setFollowerUsers([]); setFollowingUsers([]); setProfilesLoaded(true) }
    })

    return () => subscription.unsubscribe()
  }, [fetchFollowing])

  const follow = async (username) => {
    if (!currentUserId) return
    const { data: target } = await supabase
      .from('profiles').select('id, username, nickname, avatar_url, bio').eq('username', username).single()
    if (!target) return

    await supabase.from('follows').insert({ follower_id: currentUserId, following_id: target.id })
    setFollowing(prev => prev.includes(username) ? prev : [...prev, username])
    setFollowedProfiles(prev => ({ ...prev, [username]: target }))
    setFollowingUsers(prev => prev.some(u => u.username === username) ? prev : [...prev, mapProfile(target)])
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
    setFollowedProfiles(prev => { const next = { ...prev }; delete next[username]; return next })
    setFollowingUsers(prev => prev.filter(u => u.username !== username))
    setFollowVersion(v => v + 1)
  }

  const isFollowing = (username) => following.includes(username)

  return (
    <FollowContext.Provider value={{ following, followedProfiles, profilesLoaded, followerUsers, followingUsers, follow, unfollow, isFollowing, followVersion }}>
      {children}
    </FollowContext.Provider>
  )
}

export function useFollow() {
  return useContext(FollowContext)
}
