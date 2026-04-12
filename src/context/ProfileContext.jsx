import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ProfileContext = createContext(null)

const DEFAULT_PROFILE = { id: '', name: '', bio: '', avatar: null }

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(DEFAULT_PROFILE)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // 로그인된 유저 프로필 불러오기
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) fetchProfile(session.user.id)
      else { setProfileState(DEFAULT_PROFILE); setProfileLoaded(true) }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('username, nickname, bio, avatar_url')
      .eq('id', userId)
      .single()

    if (data) {
      setProfileState({
        id: data.username,
        name: data.nickname,
        bio: data.bio || '',
        avatar: data.avatar_url || null,
      })
    }
    setProfileLoaded(true)
  }

  const setProfile = async (next) => {
    setProfileState(next)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return

    await supabase.from('profiles').update({
      username: next.id,
      nickname: next.name,
      bio: next.bio,
      avatar_url: next.avatar,
    }).eq('id', session.user.id)
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile, profileLoaded }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
