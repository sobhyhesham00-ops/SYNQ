import React, { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext<any>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') || localStorage.getItem('theme_mode')
    let useDark = false
    if (saved) {
      useDark = saved === 'dark'
    } else {
      useDark = !window.matchMedia('(prefers-color-scheme: dark)').matches ? false : true
    }
    
    setIsDark(useDark)
    document.documentElement.classList.toggle('dark', useDark)
    if (useDark) {
      document.body.classList.remove('theme-light')
    } else {
      document.body.classList.add('theme-light')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
    localStorage.setItem('theme_mode', newIsDark ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', newIsDark)
    if (newIsDark) {
      document.body.classList.remove('theme-light')
    } else {
      document.body.classList.add('theme-light')
    }
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used in ThemeProvider')
  return context
}
