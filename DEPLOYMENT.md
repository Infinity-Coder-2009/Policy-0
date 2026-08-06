# Deployment Guide

> Step-by-step guide to deploy Policy-0 to production

## Prerequisites

- GitHub account
- Vercel account (for frontend)
- Render account (for backend)
- Supabase account (for database)
- NVIDIA API key

## Quick Deploy

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/policy-0.git
cd policy-0
npm ci
npm run setup
```

### 2. GitHub Repository

1. Create a new repository on GitHub
2. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/policy-0.git
git push -u origin main
```

### 3. Supabase (Database)

1. Create a new Supabase project
2. Get the database connection string
3. Add to GitHub Secrets: `DATABASE_URL`
4. Run migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. Render (Backend)

1. Connect your GitHub repo to Render
2. Create a new Web Service
3. Configure:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Standard (for GPU support)
4. Add environment variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=your-supabase-url
   JWT_SECRET=your-secret
   NVIDIA_API_KEY=your-nvidia-key
   DATA_BACKEND=postgres
   USE_COSMOS_VLM=true
   USE_NIM_LLM=true
   USE_ISAAC_SIM=true
   USE_ISAAC_LAB=true
   USE_LEAPP_EXPORT=true
   USE_OSMO=true
   CORS_ORIGINS=https://policy-0.vercel.app
   ```
5. Deploy

### 5. Vercel (Frontend)

1. Connect your GitHub repo to Vercel
2. Configure:
   - **Framework**: Vite
   - **Build Command**: `npm run build:frontend`
   - **Output Directory**: `dist`
3. Add environment variables:
   ```
   VITE_API_URL=https://policy-0-backend.onrender.com
   ```
4. Deploy

### 6. GitHub Actions (CI/CD)

Add the following secrets to your GitHub repository:
- `VERCEL_TOKEN` — Vercel API token
- `VERCEL_ORG_ID` — Vercel organization ID
- `VERCEL_PROJECT_ID` — Vercel project ID
- `RENDER_API_KEY` — Render API key
- `RENDER_SERVICE_ID` — Render service ID
- `DATABASE_URL` — Supabase connection string

## Post-Deployment

### Verify Deployment

```bash
# Test frontend
curl https://policy-0.vercel.app

# Test backend
curl https://policy-0-backend.onrender.com/api/health

# Test database
curl https://policy-0-backend.onrender.com/health/ready
```

### Run Migrations

```bash
npx prisma migrate deploy
```

### Create Admin User

```bash
# Via API
curl -X POST https://policy-0-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@policy-0.com","password":"secure123","role":"admin"}'
```

## Troubleshooting

### Frontend shows "API Error"
- Check `VITE_API_URL` environment variable
- Verify CORS settings on backend
- Check browser console for detailed errors

### Backend returns 503
- Check database connection: `DATABASE_URL`
- Verify Prisma migrations ran
- Check Render logs

### Database connection failed
- Verify Supabase is running
- Check `DATABASE_URL` format
- Ensure IP allowlist includes Render IPs

### NVIDIA services down
- Verify `NVIDIA_API_KEY` is valid
- Check NVIDIA API status page
- Review backend logs for specific errors

## Rollback

### Frontend (Vercel)
1. Go to Vercel Dashboard
2. Navigate to Deployments
3. Click on previous deployment
4. Click "Promote to Production"

### Backend (Render)
1. Go to Render Dashboard
2. Navigate to Service
3. Click "Deploy" → "Deploy previous commit"

### Database
```bash
# Rollback last migration
npx prisma migrate resolve --rolled-back "migration_name"
```

## Scaling

### Vertical Scaling
- Upgrade Render plan for more CPU/RAM
- Upgrade Supabase plan for more connections

### Horizontal Scaling
- Deploy multiple Render instances
- Use Render's autoscaling (Enterprise plan)
- Add Redis for shared caching

### Database Optimization
- Add indexes for frequent queries
- Use connection pooling (PgBouncer)
- Enable Supabase read replicas

## Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled (Vercel + Render)
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled
- [ ] Input validation on all routes
- [ ] Audit logging active
- [ ] Database backups enabled (Supabase)
- [ ] JWT secret rotated regularly
- [ ] API keys rotated regularly

## Cost Estimation

| Service | Free Tier | Production |
|---------|-----------|------------|
| Vercel | ✅ | $20/mo (Pro) |
| Render | ✅ (limited) | $25/mo (Standard) |
| Supabase | ✅ | $25/mo (Pro) |
| NVIDIA | ❌ | $50-200/mo (API calls) |
| **Total** | **$0** | **$120-300/mo** |