'use client'

import { useTheme } from './ThemeProvider'
import { css } from '@/styled-system/css'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={css({
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 2,
        bg: 'bg.default',
        color: 'fg.default',
        border: '1px solid',
        borderColor: 'border.default',
        cursor: 'pointer',
        fontSize: 'sm',
        fontWeight: 'medium',
        transition: 'colors',
        _hover: {
          bg: 'bg.muted',
        },
        _focus: {
          outline: 'none',
          ringWidth: '2',
          ringColor: 'ring.default',
        }
      })}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <svg
        className={css({ w: 4, h: 4 })}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        {theme === 'light' ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round" 
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        )}
      </svg>
    </button>
  )
}