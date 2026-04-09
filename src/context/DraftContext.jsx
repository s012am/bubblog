import { createContext, useContext, useState } from 'react'

const DraftContext = createContext(null)
export const useDraft = () => useContext(DraftContext)

const STORAGE_KEY = 'bubblog_drafts'

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

function save(list) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export function DraftProvider({ children }) {
  const [drafts, setDrafts] = useState(load)

  function saveDraft(draft) {
    // draft: { id, type, title, content, tags, savedAt }
    setDrafts((prev) => {
      const filtered = prev.filter((d) => d.id !== draft.id)
      const next = [draft, ...filtered]
      save(next)
      return next
    })
  }

  function deleteDraft(id) {
    setDrafts((prev) => {
      const next = prev.filter((d) => d.id !== id)
      save(next)
      return next
    })
  }

  return (
    <DraftContext.Provider value={{ drafts, saveDraft, deleteDraft }}>
      {children}
    </DraftContext.Provider>
  )
}
