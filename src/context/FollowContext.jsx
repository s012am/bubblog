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
    const [{ data: followingData }, { data: followerData }] = await Promise.all([
      supabase.from('follows')
        .select('profiles!following_id(id, username, nickname, avatar_url, bio)')
        .eq('follower_id', userId),
      supabase.from('follows')
        .select('profiles!follower_id(username, nickname, avatar_url, bio)')
        .eq('following_id', userId),
    ])

    const followingProfiles = (followingData || []).map(r => r.profiles).filter(Boolean)
    const followerProfiles = (followerData || []).map(r => r.profiles).filter(Boolean)

    const map = {}
    followingProfiles.forEach(p => { map[p.username] = p })

    setFollowing(followingProfiles.map(p => p.username))
    setFollowedProfiles(map)
    setFollowingUsers(followingProfiles.map(mapProfile))
    setFollowerUsers(followerProfiles.map(mapProfile))
    setProfilesLoaded(true)
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
