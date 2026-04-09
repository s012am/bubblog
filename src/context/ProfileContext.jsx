import { createContext, useContext, useState } from 'react'

const ProfileContext = createContext(null)

const STORAGE_KEY = 'bubblog_profile'

function loadProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : { name: 'ramram', bio: '', avatar: null }
  } catch {
    return { name: 'ramram', bio: '', avatar: null }
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(loadProfile)

  const setProfile = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setProfileState(next)
  }

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
