import { createContext, useContext, useState } from 'react'

const FollowContext = createContext(null)

const STORAGE_KEY = 'bubblog_following'

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function FollowProvider({ children }) {
  const [following, setFollowing] = useState(load)

  const follow = (name) => {
    setFollowing((prev) => {
      const next = prev.includes(name) ? prev : [...prev, name]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const unfollow = (name) => {
    setFollowing((prev) => {
      const next = prev.filter((n) => n !== name)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const isFollowing = (name) => following.includes(name)

  return (
    <FollowContext.Provider value={{ following, follow, unfollow, isFollowing }}>
      {children}
    </FollowContext.Provider>
  )
}

export function useFollow() {
  return useContext(FollowContext)
}
