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
      radius: 'none',
    }),
  ],
  include: ['./src/**/*.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  jsxFramework: 'react',
  outdir: 'styled-system',
  theme: {
    extend: {
      tokens: {
        fonts: {
          sans: { value: ['var(--font-jakarta)', 'system-ui', 'sans-serif'] }
        }
      }
    }
  }
})