# Policy-0

> Robotics Policy Generation Platform - Enhanced Version

[![CI/CD](https://github.com/policy-0/policy-0/actions/workflows/ci.yml/badge.svg)](https://github.com/policy-0/policy-0/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Policy-0 is a full-stack platform for generating, simulating, and deploying robot control policies using NVIDIA's AI stack. It provides an end-to-end workflow from task description to verified, exportable robot policies.

## 🚀 Live Demo

- **Frontend**: https://policy-0.vercel.app
- **Backend**: https://delightful-cooperation-production-a998.up.railway.app
- **API Docs**: https://delightful-cooperation-production-a998.up.railway.app/api
- **Health Check**: https://delightful-cooperation-production-a998.up.railway.app/api/health

## ✨ Features

### Policy Generation Methods
- **Plan A - Symbolic Trajectory Code**: For precise, repeatable manipulation tasks with Cartesian impedance control
- **Plan B - Neural VLA Policy (ONNX)**: Vision-based manipulation with neural policy predictions
- **Plan C - Reinforcement Learning (PPO)**: Complex locomotion and dexterous manipulation via GPU-accelerated training

### Core Features
- **Task-to-Policy**: Describe a robot task in natural language → get a working policy
- **VLM Analysis**: Cosmos Reasoner NIM for video/text understanding
- **Policy Synthesis**: NIM LLM (Llama 3.1 70B) for code generation
- **Physics Simulation**: Isaac Sim for realistic physics verification
- **RL Training**: Isaac Lab for GPU-accelerated reinforcement learning
- **ONNX Export**: LEAPP for optimized model export
- **Measured Flywheel**: Verified evolution with real simulation feedback
- **Multi-Robot**: Franka Panda, UR5e, Kinova Gen3, Unitree H1
- **Observability**: Prometheus metrics, Grafana dashboards, audit logging

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   PostgreSQL    │
│   (Vercel)      │     │   (Railway)     │     │   (Supabase)    │
│   React 19      │     │   Express       │     │                 │
│   Tailwind CSS  │     │   TypeScript    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   NVIDIA Stack  │
                        │   Cosmos VLM    │
                        │   NIM LLM       │
                        │   Isaac Sim     │
                        │   Isaac Lab     │
                        │   OSMO          │
                        └─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- React 19, TypeScript 5.8
- Tailwind CSS 4, Vite 6
- React Router, TanStack Query, Zustand
- Recharts, React Hook Form, Zod

### Backend
- Express, TypeScript 5.8
- Prisma ORM, PostgreSQL
- JWT + RBAC, Zod validation
- Prometheus metrics, Pino logging

### Infrastructure
- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## 📦 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL (or Supabase account)
- NVIDIA API key (for NVIDIA services)

### Installation

```bash
# Clone the repository
git clone https://github.com/policy-0/policy-0.git
cd policy-0

# Install dependencies
npm ci

# Setup environment
npm run setup

# Edit .env with your secrets
nano .env

# Generate Prisma client
npm run prisma:generate

# Run migrations (if using PostgreSQL)
npm run prisma:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Server
NODE_ENV=development
PORT=2009
DATA_BACKEND=json  # or 'postgres' for production

# Database (when DATA_BACKEND=postgres)
DATABASE_URL=postgresql://user:pass@host:5432/policy0

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
POLICY0_API_KEY=policy0-dev-key-change-in-production

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_your_clerk_secret_key

# Supabase
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_key

# NVIDIA
NVIDIA_API_KEY=nvapi-your-nvidia-api-key
NVIDIA_API_BASE=https://api.nvidia.com
NIM_LLM_ENDPOINT=https://api.nvidia.com/v1/nim/llama-3-70b
COSMOS_NIM_ENDPOINT=https://api.nvidia.com/v1/cosmos/reasoner

# Feature Flags
USE_COSMOS_VLM=true
USE_NIM_LLM=true
USE_ISAAC_SIM=true
USE_ISAAC_LAB=true
USE_LEAPP_EXPORT=true
USE_OSMO=true

# CORS
CORS_ORIGINS=http://localhost:5173,https://policy-0.vercel.app
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Typecheck
npm run typecheck
```

## 🚢 Deployment

### GitHub Setup
```bash
# Push to GitHub
git add .
git commit -m "feat: enhanced policy generation and auth"
git push origin main
```

### Frontend Deployment (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (point to Railway backend)
   - `VITE_POLICY0_API_KEY`
3. Deploy automatically on push to main

### Backend Deployment (Railway)
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard:
   - All variables from `.env.example`
   - PostgreSQL connection details
3. Railway will automatically detect and deploy

### Database (Supabase)
1. Apply migrations:
```bash
npm run prisma:migrate
```

### Verification Checklist
- [ ] Frontend accessible at your Vercel URL
- [ ] Backend accessible at your Railway URL
- [ ] GitHub Actions workflow passing
- [ ] API health check returns 200
- [ ] Authentication works (Clerk setup)

## 📚 Documentation

- [Architecture](ARCHITECTURE.md) - System design and component overview
- [API Reference](API.md) - Complete API documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Contributing](CONTRIBUTING.md) - How to contribute
- [CONTEXT.md](CONTEXT.md) - Project context and improvements

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- NVIDIA for Cosmos, NIM, Isaac Sim, Isaac Lab, and OSMO
- Vercel for frontend hosting
- Railway for backend hosting
- Supabase for database hosting

---

Built with ❤️ by the Policy-0 team
