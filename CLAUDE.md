- USE MCPs , supabase and browser tools specifically
- Critical requirement: ALL new DB tables must follow security standards
- see quote-buddy-app/SECURITY_GUIDE.md
- Critical requirement: Perform routine security audits using validation tools
- see quote-buddy-app/SECURITY_AUDIT_GUIDE.md

- see /Users/ben.green/Documents/Github/FunL/CODING_STANDARDS.md
- see /Users/ben.green/Documents/Github/FunL/DEVELOPMENT_PLAN.md
- Do not keep legacy code. Clean as you go. Backwards Compatible is not required.
- npm run typecheck: Run the typechecker

## 🎨 UI/Design System - MANDATORY RULES

**WE USE PARK UI + PANDA CSS. DO NOT WRITE CUSTOM BUTTON/FORM CSS.**

### Buttons - ALWAYS use Park UI Button component
```tsx
import { Button } from '@/components/ui/button'

// ✅ PRIMARY ACTIONS (green)
<Button variant="solid">Save</Button>
<Button variant="solid" size="sm">Create</Button>

// ✅ SECONDARY ACTIONS (outline/ghost)
<Button variant="outline">Cancel</Button>
<Button variant="ghost">View Details</Button>

// ❌ NEVER WRITE CUSTOM BUTTON CSS
// WRONG: <button className={css({ bg: 'blue.600', ... })}>
// WRONG: <button className={css({ bg: 'accent.default', ... })}>
// WRONG: <button style={{ background: 'green' }}>
```

### Design Tokens - When styling custom elements
```tsx
import { css } from '@/styled-system/css'

// ✅ USE THESE TOKENS ONLY
bg: 'accent.default'      // Green - primary
bg: 'accent.emphasized'   // Darker green - hover
bg: 'bg.muted'           // Muted gray background
color: 'fg.default'      // Default text
color: 'fg.muted'        // Muted text
color: 'accent.default'  // Green text

// ❌ NEVER USE HARDCODED COLORS
// WRONG: bg: 'blue.600'
// WRONG: bg: 'green.100'
// WRONG: color: 'red.500'
// WRONG: color: 'yellow.700'
```

### Config Reference
- Panda config: `/Users/ben.green/Documents/Github/FunL/funl-app/panda.config.ts`
- Accent color: mint (green)
- Gray color: neutral
- All Park UI components: `/Users/ben.green/Documents/Github/FunL/funl-app/components/ui/`