import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'
import mint from '@park-ui/panda-preset/colors/mint'
import neutral from '@park-ui/panda-preset/colors/neutral'

export default defineConfig({
  preflight: true,
  presets: [
    '@pandacss/preset-base',
    createPreset({
      accentColor: mint,
      grayColor: neutral,
      borderRadius: 'none',
      additionalColors: ['*'], // Include all available colors
    }),
  ],
  include: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  exclude: [],
  
  conditions: {
    light: '[data-color-mode=light] &',
    dark: '[data-color-mode=dark] &',
  },
  
  theme: {
    extend: {
      tokens: {
        fonts: {
          mono: { value: 'var(--font-roboto-mono), monospace' }
        }
      }
    }
  },
  
  globalCss: {
    'html': {
      colorScheme: 'dark light',
    },
    'html[data-color-mode="light"]': {
      colorScheme: 'light',
    },
    'html[data-color-mode="dark"]': {
      colorScheme: 'dark',
    },
    'body': {
      bg: 'bg.canvas',
      color: 'fg.default',
      fontFamily: 'mono',
    }
  },
  
  jsxFramework: 'react',
  outdir: 'styled-system',
})