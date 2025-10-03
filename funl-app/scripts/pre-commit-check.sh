#!/bin/bash
# Pre-commit validation script
# This mirrors what Vercel runs during deployment

set -e

echo "🔍 Pre-commit validation (mirrors Vercel build)"
echo "================================================"
echo ""

# Change to funl-app directory
cd "$(dirname "$0")/.."

echo "✓ Step 1/4: Running Panda CSS codegen..."
npm run prepare
echo ""

echo "✓ Step 2/4: Running TypeScript type check..."
npm run typecheck
echo ""

echo "✓ Step 3/4: Running ESLint..."
npm run lint
echo ""

echo "✓ Step 4/4: Running production build (dry run)..."
echo "   This is what Vercel runs - it checks types AND linting"
NODE_ENV=production npm run build
echo ""

echo "================================================"
echo "✅ All checks passed! Safe to commit and push."
echo "================================================"
