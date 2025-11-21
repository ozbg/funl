# Husky Pre-commit Hooks

This directory contains Git hooks managed by Husky to ensure code quality before commits.

## What's Configured

### Pre-commit Hook
Automatically runs TypeScript type checking before every commit:
- ✅ Prevents commits with TypeScript errors
- ⚡ Fast - only runs `tsc --noEmit`
- 🔄 Runs automatically on `git commit`

## Setup for New Developers

When you clone this repo and run `npm install` in the `funl-app/` directory, Husky will automatically install the hooks. No manual setup needed!

## Bypassing Hooks (Emergency Only)

If you absolutely need to commit without running hooks:
```bash
git commit --no-verify -m "your message"
```

⚠️ **Warning**: Only use `--no-verify` in emergencies. The hooks exist to catch errors before they reach CI/CD.

## Modifying Hooks

The pre-commit script is located at: `funl-app/scripts/pre-commit-check.sh`

After modifying, test locally:
```bash
./funl-app/scripts/pre-commit-check.sh
```
