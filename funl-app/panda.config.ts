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
  
  theme: {
    extend: {
      tokens: {
        fonts: {
          mono: { value: 'var(--font-roboto-mono), monospace' }
        }
      },
      semanticTokens: {
        colors: {
          bg: {
            canvas: {
              value: {
                base: '{colors.white}',
                _dark: '#000000'  // True black background
              }
            },
            default: {
              value: {
                base: '{colors.white}',
                _dark: '#0a0a0a'  // Near black for content areas
              }
            },
            muted: {
              value: {
                base: '#f5f5f5',
                _dark: '#1a1a1a'
              }
            }
          },
          accent: {
            default: {
              value: {
                base: '{colors.mint.9}',
                _dark: '{colors.mint.9}'
              }
            },
            emphasis: {
              value: {
                base: '{colors.mint.10}',
                _dark: '{colors.mint.10}'
              }
            },
            muted: {
              value: {
                base: '{colors.mint.3}',
                _dark: '{colors.mint.3}'
              }
            }
          }
        }
      }
    }
  },
  
  globalCss: {
    'html.dark': {
      colorScheme: 'dark',
      bg: '#000000',  // True black
    },
    'body': {
      bg: 'bg.canvas',
      color: 'fg.default',
    }
  },
  
  jsxFramework: 'react',
  outdir: 'styled-system',
})