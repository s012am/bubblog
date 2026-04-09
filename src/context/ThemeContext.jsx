import { createContext, useContext, useEffect, useState } from 'react'

export const THEMES = [
  { id: 'default', label: '기본',  bg: '#f4f4f5', unread: 'rgba(239,246,255,1)',   dot: '#60a5fa' },
  { id: 'warm',    label: '웜',    bg: '#fdf1ea', unread: 'rgba(255,243,232,1)',   dot: '#fb923c' },
  { id: 'rose',    label: '로즈',  bg: '#fdf0f3', unread: 'rgba(255,236,243,0.75)', dot: '#f472b6' },
  { id: 'sage',    label: '세이지', bg: '#eef4f0', unread: 'rgba(232,247,238,1)',  dot: '#34a85a' },
  { id: 'cool',    label: '쿨',    bg: '#eff3fd', unread: 'rgba(232,240,255,1)',   dot: '#818cf8' },
  { id: 'dark',    label: '다크',  bg: '#1c1c1e', unread: 'rgba(255,255,255,0.07)', dot: '#ffffff' },
]

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => localStorage.getItem('bubblog_theme') || 'default')

  useEffect(() => {
    const theme = THEMES.find((t) => t.id === themeId) || THEMES[0]
    document.body.style.background = theme.bg
    localStorage.setItem('bubblog_theme', themeId)
    if (themeId === 'dark') {
      document.documentElement.setAttribute('data-dark', 'true')
    } else {
      document.documentElement.removeAttribute('data-dark')
    }
  }, [themeId])

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
