#!/bin/bash
# Pre-commit validation script
# Runs TypeScript type checking before allowing commits

set -e

echo "🔍 Pre-commit validation"
echo "========================"
echo ""

# Change to funl-app directory
cd "$(dirname "$0")/.."

echo "✓ Running TypeScript type check..."
npm run typecheck
echo ""

echo "========================"
echo "✅ Type check passed!"
echo "========================"
