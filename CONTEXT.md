# Policy-0 Project Context

## Overview
Policy-0 is a robotics policy generation platform. It takes natural language task descriptions, analyzes them using Vision-Language Models, synthesizes robot control policies, verifies them in physics simulation, and exports them for real-world deployment.

## Live URLs
- **Frontend**: https://policy-0.vercel.app
- **Backend**: https://delightful-cooperation-production-a998.up.railway.app
- **Backend Health**: https://delightful-cooperation-production-a998.up.railway.app/api/health

## Architecture
```
Frontend (Vercel) → Backend (Railway) → Database (Supabase)
     ↓                      ↓                      ↓
  React 19              Express.js             PostgreSQL
  Clerk Auth            JSON Store             + Realtime
  Tailwind CSS          NVIDIA APIs
```

## Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite, Clerk Auth, Supabase Client
- **Backend**: Express.js, TypeScript, JSON Store, NVIDIA APIs (Cosmos VLM, NIM LLM, Isaac Sim/Lab)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk (JWT-based)
- **Deployment**: Vercel (frontend), Railway (backend)

## Key Files
- `src/App.tsx` - Main router with protected routes
- `src/main.tsx` - Entry point with ClerkProvider
- `src/pages/auth.tsx` - Login/Signup pages (Clerk components)
- `src/pages/Dashboard.tsx` - Main dashboard
- `src/pages/Generate.tsx` - Policy generation workflow
- `src/pages/Policies.tsx` - Policy list/detail
- `src/pages/Flywheel.tsx` - Evolution/telemetry dashboard
- `src/pages/Settings.tsx` - User settings
- `src/pages/Health.tsx` - System health monitoring
- `src/lib/api.ts` - API client
- `src/lib/supabase.ts` - Supabase client
- `src/stores/authStore.ts` - Auth state (legacy, not used with Clerk)
- `src/stores/uiStore.ts` - UI state
- `src/components/layout/index.tsx` - Header, Sidebar, Layout
- `src/components/ui/index.tsx` - UI components (Button, Card, Badge, etc.)
- `src/components/Toast.tsx` - Toast notifications
- `src/components/ProtectedRoute.tsx` - Auth wrapper
- `server.ts` - Main backend server (50+ API endpoints)
- `supabase/migrations/20250101000000_init.sql` - Database schema

## API Endpoints (Backend)
- `/api/auth/register` - User registration
- `/api/auth/login` - User login (returns JWT)
- `/api/auth/refresh` - Refresh token
- `/api/auth/logout` - Logout
- `/api/auth/me` - Get current user
- `/api/health` - Health check
- `/api/nvidia/health` - NVIDIA service health
- `/api/policies` - List policies
- `/api/policy/generate` - Generate policy
- `/api/policy/:id` - Get/Delete policy
- `/api/upload/video` - Upload video
- `/api/policy/analyze-vlm` - VLM analysis
- `/api/policy/analyze-description` - Description analysis
- `/api/policy/generate-video` - Generate video
- `/api/policy/onnx-export` - ONNX export
- `/api/telemetry/collect` - Collect telemetry
- `/api/telemetry/simulate` - Simulate deployment
- `/api/telemetry/runs` - Get runs
- `/api/telemetry/stats` - Get stats
- `/api/improvements/generate` - Generate improvements
- `/api/improvements/apply` - Apply improvement
- `/api/evolution/regenerate` - Evolve policy
- `/api/evolution/curve/:id` - Success rate curve
- `/api/evolution/gap/:id` - Sim-to-real gap
- `/api/isaaclab/train` - Isaac Lab training
- `/api/osmo/*` - OSMO orchestration
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/metrics` - Prometheus metrics

## Environment Variables
See `.env.example` for full list.

## Status
- ✅ Frontend deployed (Vercel)
- ✅ Backend deployed (Railway)
- ✅ Database schema ready (Supabase)
- ✅ Clerk auth integrated
- ✅ 92 tests passing
- ⚠️ Login/signup flow needs email verification (Clerk default)

## Next Steps
1. Configure Clerk production instance (whitelist domain)
2. Run Supabase migrations
3. Test full auth flow with email verification
4. Add real NVIDIA API integration testing
5. Build MCP database (future phase)

## Credentials Location
All tokens and keys are stored in `.opencode/mcp.json` and environment variables.
See `credentials.json` for full list.