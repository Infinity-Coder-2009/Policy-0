# Policy-0

> Robotics Policy Generation Platform

[![CI/CD](https://github.com/policy-0/policy-0/actions/workflows/ci.yml/badge.svg)](https://github.com/policy-0/policy-0/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

Policy-0 is a full-stack platform for generating, simulating, and deploying robot control policies using NVIDIA's AI stack. It provides an end-to-end workflow from task description to verified, exportable robot policies.

## 🚀 Live Demo

- **Frontend**: https://policy-0.vercel.app
- **Backend**: https://policy-0-backend.onrender.com
- **API Docs**: https://policy-0-backend.onrender.com/api

## ✨ Features

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
│   (Vercel)      │     │   (Render)      │     │   (Supabase)    │
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
- **Backend**: Render
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

# Run migrations
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

# NVIDIA
NVIDIA_API_KEY=your-nvidia-api-key

# Feature Flags
USE_COSMOS_VLM=true
USE_NIM_LLM=true
USE_ISAAC_SIM=true
USE_ISAAC_LAB=true
USE_LEAPP_EXPORT=true
USE_OSMO=true

# CORS
CORS_ORIGINS=http://localhost:5173
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Typecheck
npm run typecheck
```

## 🚢 Deployment

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Render)
```bash
# Automatic via GitHub Actions on push to main
# Or manual:
render deploy
```

### Database (Supabase)
```bash
npm run prisma:migrate
```

## 📚 Documentation

- [Architecture](ARCHITECTURE.md) - System design and component overview
- [API Reference](API.md) - Complete API documentation
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Contributing](CONTRIBUTING.md) - How to contribute

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- NVIDIA for Cosmos, NIM, Isaac Sim, Isaac Lab, and OSMO
- Vercel for frontend hosting
- Render for backend hosting
- Supabase for database hosting

---

Built with ❤️ by the Policy-0 team