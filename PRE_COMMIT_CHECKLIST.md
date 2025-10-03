# Pre-Commit Checklist

## The Problem

**Vercel runs different checks than local development:**
- Local: We were only running `npm run typecheck` (TypeScript only)
- Vercel: Runs `next build` which includes **both TypeScript AND ESLint**
- Vercel's Next.js treats ESLint warnings as **build failures**

This causes builds to pass locally but fail on Vercel.

## The Solution

### Automated Pre-Commit Script

Run this before every commit:

```bash
cd funl-app
./scripts/pre-commit-check.sh
```

Or use the npm script:

```bash
npm run pre-commit
```

This script mirrors exactly what Vercel runs:
1. ✅ Panda CSS codegen
2. ✅ TypeScript type checking
3. ✅ ESLint validation
4. ✅ Production build (full Next.js build)

### Manual Checklist (if script fails)

If the pre-commit script fails, fix issues in this order:

#### 1. TypeScript Errors
```bash
npm run typecheck
```

**Fix all errors before proceeding.** TypeScript errors will block the build.

Common issues:
- Missing type imports
- `any` types (replace with `unknown` or proper types)
- Type mismatches in function arguments
- Missing properties on interfaces

#### 2. ESLint Errors
```bash
npm run lint
```

**Critical: Fix ALL errors AND warnings.** Vercel fails on warnings too.

Common issues in PassKit code:
- `react/no-unescaped-entities` - Use `&quot;` instead of `"`
- `@typescript-eslint/no-explicit-any` - Replace `any` with `unknown` or specific types
- `@typescript-eslint/no-unused-vars` - Remove unused imports/variables or prefix with `_`
- `react-hooks/exhaustive-deps` - Add missing dependencies or disable with comment if intentional

#### 3. Production Build
```bash
npm run build
```

This is the **ultimate test** - exactly what Vercel runs.

If this passes, your commit will deploy successfully.

#### 4. Clean Up Test Artifacts

Before committing:
- Remove `console.log()` debug statements
- Delete test files (`test-*.js`, `*.test.ts` if not in `__tests__/`)
- Remove debug directories (`broken_pass/`, `pass_debug/`, etc.)
- Delete generated test files (`TEST_PASS.pkpass`, `*.test.pkpass`)

#### 5. Verify Git Status

```bash
git status
```

Check for:
- Unintended file additions (test files, debug artifacts)
- Missing files that should be committed
- Files that should be in `.gitignore`

## Quick Reference: Common Fixes

### Fix: Unescaped Quotes in JSX
```tsx
// ❌ Bad
<p>Click "Save" to continue</p>

// ✅ Good
<p>Click &quot;Save&quot; to continue</p>
```

### Fix: Explicit Any Types
```typescript
// ❌ Bad
config?: Record<string, any>

// ✅ Good
config?: Record<string, unknown>
```

### Fix: Type Conversion
```typescript
// ❌ Bad - direct conversion may fail
const field = item as TargetType

// ✅ Good - double assertion when needed
const field = item as unknown as TargetType
```

### Fix: Unused Variables
```typescript
// ❌ Bad
const { textAlignment, ...rest } = field

// ✅ Good - prefix with underscore
const { textAlignment: _textAlignment, ...rest } = field

// ✅ Better - ESLint disable comment
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { textAlignment, ...rest } = field
```

## Package.json Scripts

Add this to `package.json`:

```json
{
  "scripts": {
    "pre-commit": "./scripts/pre-commit-check.sh",
    "typecheck": "tsc --noEmit",
    "lint": "eslint",
    "build": "panda codegen && next build --turbopack"
  }
}
```

## Git Hooks (Optional but Recommended)

Install Husky to run checks automatically:

```bash
npm install -D husky
npx husky init
echo "npm run pre-commit" > .husky/pre-commit
```

This prevents commits that would fail on Vercel.

## What Went Wrong in PassKit Implementation

### Issue 1: Only ran `npm run typecheck`
- **What we did:** Ran TypeScript check only
- **What we missed:** ESLint validation
- **Result:** TypeScript passed, ESLint failed on Vercel

### Issue 2: ESLint warnings treated as errors
- **What we saw:** Warnings locally
- **What Vercel does:** Fails build on warnings
- **Result:** "Warning" about unused vars = build failure

### Issue 3: Didn't test production build
- **What we did:** Assumed typecheck was enough
- **What we should do:** Always run `npm run build`
- **Result:** Surprises on Vercel that could've been caught locally

## The Golden Rule

**Before every commit:**

```bash
npm run build
```

If `npm run build` succeeds locally, **it will succeed on Vercel.**

If `npm run build` fails locally, **fix it before committing.**

No exceptions. No shortcuts.

## Future Improvements

1. **Pre-commit hook** - Automatic validation before commits
2. **Pre-push hook** - Final check before pushing to remote
3. **CI/CD integration** - Run checks on pull requests
4. **ESLint auto-fix** - `npm run lint --fix` for simple issues
5. **Type coverage** - Track and improve type safety over time

## Emergency: Build Failing on Vercel

If a build is already failing on Vercel:

1. Pull the failing commit locally
2. Run `npm run build` - you'll see the same errors
3. Fix all errors (see checklist above)
4. Run `npm run build` again until it passes
5. Commit and push the fix
6. Vercel will automatically retry and should succeed

## Summary

| Command | What it checks | When to use |
|---------|---------------|-------------|
| `npm run typecheck` | TypeScript only | During development |
| `npm run lint` | ESLint only | After code changes |
| `npm run build` | **Everything** | **Before every commit** |
| `./scripts/pre-commit-check.sh` | All of the above | **Required pre-commit** |

**Remember:** Vercel runs `npm run build`. If that passes locally, you're good to go.
