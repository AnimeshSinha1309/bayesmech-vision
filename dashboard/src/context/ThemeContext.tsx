import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ThemeMode } from '../types'

interface ThemeContextValue {
  theme: ThemeMode
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // localStorage may be unavailable
  }
  return 'light'
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  // Sync the body class and localStorage whenever the theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }

    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Ignore write errors
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
