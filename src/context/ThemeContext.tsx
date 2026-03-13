import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Theme } from '../types'

export const ACCENT_COLORS = [
  { name: '보라',   value: '#7c3aed' },
  { name: '파랑',   value: '#2563eb' },
  { name: '하늘',   value: '#0891b2' },
  { name: '초록',   value: '#16a34a' },
  { name: '주황',   value: '#ea580c' },
  { name: '분홍',   value: '#db2777' },
  { name: '빨강',   value: '#dc2626' },
]

const DEFAULT_ACCENT = '#7c3aed'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
  accentColor: string
  setAccentColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [accentColor, setAccentState] = useState<string>(() => {
    return localStorage.getItem('accent_color') ?? DEFAULT_ACCENT
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--color-accent', accentColor)
    localStorage.setItem('accent_color', accentColor)
  }, [accentColor])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggleTheme = () => setThemeState(t => t === 'dark' ? 'light' : 'dark')
  const setAccentColor = (color: string) => setAccentState(color)

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
