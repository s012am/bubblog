import { createContext, useContext, useState } from 'react'

const RebubbleContext = createContext(null)

const STORAGE_KEY = 'bubblog_rebubbled'

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export function RebubbleProvider({ children }) {
  const [rebubbledIds, setRebubbledIds] = useState(load)

  const toggle = (id) => {
    setRebubbledIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const isRebubbled = (id) => rebubbledIds.includes(id)

  return (
    <RebubbleContext.Provider value={{ rebubbledIds, toggle, isRebubbled }}>
      {children}
    </RebubbleContext.Provider>
  )
}

export function useRebubble() {
  return useContext(RebubbleContext)
}
