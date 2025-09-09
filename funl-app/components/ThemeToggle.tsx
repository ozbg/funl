'use client'

import { useTheme } from './ThemeProvider'
import { css } from '@/styled-system/css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={css({
        position: 'fixed',
        top: 4,
        right: 4,
        p: 2,
        borderRadius: 'none',
        bg: 'accent.default',
        color: 'neutral.fg',
        border: '1px solid',
        borderColor: 'border.default',
        cursor: 'pointer',
        fontSize: 'sm',
        fontWeight: 'medium',
        zIndex: 50,
        _hover: {
          bg: 'accent.emphasis',
        },
        _focus: {
          outline: 'none',
          ringWidth: '2px',
          ringColor: 'accent.default',
          ringOffset: '2px',
        }
      })}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark' : 'Light'}
    </button>
  )
}