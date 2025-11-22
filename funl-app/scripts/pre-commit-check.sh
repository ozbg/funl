#!/bin/bash
# Pre-commit validation script
# Runs TypeScript type checking and linting before allowing commits

set -e

echo "🔍 Pre-commit validation"
echo "========================"
echo ""

# Change to funl-app directory
cd "$(dirname "$0")/.."

echo "✓ Running TypeScript type check..."
npm run typecheck
echo ""

echo "✓ Running ESLint..."
npm run lint
echo ""

echo "========================"
echo "✅ All checks passed!"
echo "========================"
