#!/bin/bash
# =============================================================================
# Policy-0 Deployment Script
# =============================================================================

set -e

echo "🚀 Deploying Policy-0 to production..."
echo ""

# ===== Pre-flight checks =====
echo "📋 Running pre-flight checks..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. Found: $(node -v)"
  exit 1
fi
echo "✅ Node.js $(node -v)"

# Check .env exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Run: ./scripts/setup-env.sh"
  exit 1
fi
echo "✅ .env file found"

# ===== Run tests =====
echo ""
echo "🧪 Running tests..."
npm test
echo "✅ All tests passed"

# ===== Typecheck =====
echo ""
echo "🔍 Running typecheck..."
npx tsc --noEmit
echo "✅ Typecheck passed"

# ===== Build =====
echo ""
echo "🏗️  Building..."
npm run build
echo "✅ Build complete"

# ===== Database migrations =====
echo ""
echo "🗄️  Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations complete"

# ===== Deploy Frontend to Vercel =====
echo ""
echo "🌐 Deploying frontend to Vercel..."
if command -v vercel &> /dev/null; then
  vercel --prod --yes
  echo "✅ Frontend deployed to Vercel"
else
  echo "⚠️  Vercel CLI not found. Install with: npm i -g vercel"
  echo "   Then run: vercel --prod"
fi

# ===== Deploy Backend to Render =====
echo ""
echo "🖥️  Deploying backend to Render..."
if command -v render &> /dev/null; then
  render deploy
  echo "✅ Backend deployed to Render"
else
  echo "⚠️  Render CLI not found. Deploy via GitHub Actions or Render Dashboard"
fi

# ===== Post-deploy verification =====
echo ""
echo "🔍 Running post-deploy verification..."

# Wait for deployment
sleep 10

# Test backend health
HEALTH_URL="${BACKEND_URL:-https://policy-0-backend.onrender.com}/api/health"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Backend health check passed"
else
  echo "⚠️  Backend health check returned HTTP $HTTP_CODE"
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📊 Dashboard: https://policy-0.vercel.app"
echo "🔧 API: https://policy-0-backend.onrender.com"
echo "📈 Metrics: https://policy-0-backend.onrender.com/metrics"