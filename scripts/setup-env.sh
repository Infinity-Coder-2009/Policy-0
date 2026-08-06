#!/bin/bash
# =============================================================================
# Policy-0 Environment Setup Script
# =============================================================================

set -e

echo "🔧 Setting up Policy-0 environment..."

# Check if .env exists
if [ -f .env ]; then
  echo "⚠️  .env already exists. Overwrite? (y/n)"
  read -r response
  if [ "$response" != "y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

# Copy example env
cp .env.example .env

# Generate JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32)
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env

echo ""
echo "✅ Environment file created: .env"
echo ""
echo "📝 Please fill in the following secrets:"
echo "   - NVIDIA_API_KEY"
echo "   - DATABASE_URL (if using Supabase)"
echo "   - POSTGRES_PASSWORD"
echo ""
echo "🔑 Generated JWT_SECRET: $JWT_SECRET"
echo ""
echo "Next steps:"
echo "   1. Edit .env with your secrets"
echo "   2. Run: npm install"
echo "   3. Run: npm run prisma:generate"
echo "   4. Run: npm run prisma:migrate"
echo "   5. Run: npm run dev"