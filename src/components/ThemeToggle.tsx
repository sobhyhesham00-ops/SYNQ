import { useTheme } from '../context/ThemeContext'

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  
  return (
    <button 
      onClick={toggleTheme}
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--border-light)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontSize: '16px'
      }}
      title="Toggle theme"
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
