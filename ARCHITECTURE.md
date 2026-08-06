# Policy-0 Architecture

> Detailed system design and component overview

## System Overview

Policy-0 is a full-stack robotics policy generation platform. It takes natural language task descriptions, analyzes them using Vision-Language Models, synthesizes robot control policies, verifies them in physics simulation, and exports them for real-world deployment.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Web App    │  │   CLI Tool   │  │   API Client │                  │
│  │   (React)    │  │   (future)   │  │   (future)   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
└─────────┼─────────────────┼─────────────────┼──────────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │   Nginx (SSL termination, rate limiting, load balancing)        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │   Express Server (TypeScript)                                    │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│  │   │ Auth Layer  │  │  Validation │  │ Rate Limit  │            │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘            │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│  │   │   Routes    │  │ Middleware  │  │   Audit     │            │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │   Service Layer                                                  │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│  │   │  Policy     │  │ Evolution   │  │  Telemetry  │            │    │
│  │   │  Service    │  │  Service    │  │  Service    │            │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘            │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│  │   │   Auth      │  │    NVIDIA   │  │    User     │            │    │
│  │   │  Service    │  │  Service    │  │  Service    │            │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │   Data Layer                                                     │    │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │    │
│  │   │   Prisma    │  │    JSON     │  │   Memory    │            │    │
│  │   │   ORM       │  │   Store     │  │   Cache     │            │    │
│  │   └─────────────┘  └─────────────┘  └─────────────┘            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA STORES                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  PostgreSQL  │  │    Redis     │  │   Object     │                  │
│  │  (Supabase)  │  │   (future)   │  │   Storage    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       NVIDIA SERVICES                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Cosmos VLM  │  │   NIM LLM    │  │  Isaac Sim   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Isaac Lab   │  │    LEAPP     │  │    OSMO      │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### Frontend (React + Vite)

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Root component with routing |
| `pages/` | Page components (Dashboard, Generate, Policies, Flywheel, Settings, Health) |
| `components/ui/` | Reusable UI components (Button, Card, Badge, Input, etc.) |
| `components/layout/` | Layout components (Header, Sidebar) |
| `stores/` | Zustand stores (auth, ui) |
| `lib/api.ts` | API client with auth headers |

### Backend (Express + TypeScript)

| Component | Purpose |
|-----------|---------|
| `server.ts` | Main server with all routes |
| `middleware/auth.ts` | JWT auth, RBAC, API key, audit logging |
| `middleware/security.ts` | Rate limiting, Zod validation, CORS |
| `pipeline/` | Business logic (VLM, LLM, Isaac Sim, evolution) |
| `data/` | Data access (Prisma, JSON store) |

### Data Layer

| Component | Purpose |
|-----------|---------|
| `prisma/schema.prisma` | Database schema |
| `data/authStore.ts` | User/auth persistence |
| `data/policyStore.ts` | Policy persistence |
| `data/jsonPersistence.ts` | JSON fallback store |
| `data/postgresPersistence.ts` | PostgreSQL store |

## Data Flow

### Policy Generation Flow
```
1. User submits task description
2. VLM (Cosmos/NIM) analyzes task → structured spec
3. LLM (NIM) synthesizes Python policy code
4. MuJoCo XML scene generated
5. Isaac Sim runs physics simulation
6. Telemetry collected → success rate measured
7. Policy exported (ONNX, Python, ROS2)
```

### Evolution Flow
```
1. User triggers evolution with improvements
2. System generates v(next) with changes baked in
3. v(next) submitted to Isaac Sim for verification
4. Measured success compared to v(current)
5. If gain ≥ 2pp → verified = true
6. If verified && mode=REAL → auto-deploy enabled
```

### Authentication Flow
```
1. User logs in with email/password
2. Server returns JWT access + refresh tokens
3. Access token stored in localStorage
4. API requests include Bearer token + x-api-key
5. Refresh token used to get new access token
6. Logout revokes refresh token
```

## Security Model

| Layer | Implementation |
|-------|---------------|
| Transport | HTTPS (Vercel + Render) |
| Authentication | JWT (HS256, 24h expiry) |
| Authorization | RBAC (admin/operator/viewer) |
| API Key | Legacy support for programmatic access |
| Rate Limiting | strict (20/min), upload (10/min), general (100/min) |
| CORS | Configurable allowed origins |
| Input Validation | Zod schemas on all routes |
| Audit Logging | All mutations logged with user + metadata |
| Secrets | Environment variables, never committed |

## NVIDIA Integration

| Service | Purpose | Status |
|---------|---------|--------|
| Cosmos Reasoner NIM | Video/text understanding | ✅ Integrated |
| NIM LLM (Llama 3.1 70B) | Policy code synthesis | ✅ Integrated |
| Isaac Sim | Physics simulation | ✅ Integrated |
| Isaac Lab | RL training | ✅ Integrated |
| LEAPP | ONNX export | ✅ Integrated |
| Isaac ROS | ROS2 deployment | ✅ Integrated |
| OSMO | Multi-node orchestration | ✅ Integrated |

## Scaling Considerations

- **Horizontal**: Stateless backend allows multiple instances
- **Database**: PostgreSQL connection pooling via Prisma
- **Caching**: Redis (planned) for frequent queries
- **Queue**: Job queue (planned) for async policy generation
- **CDN**: Vercel Edge Network for frontend assets
- **GPU**: Isaac Sim/Lab require NVIDIA GPU nodes

## Monitoring

- **Metrics**: Prometheus `/metrics` endpoint
- **Dashboards**: Grafana with auto-provisioned dashboards
- **Logging**: Pino structured logs
- **Alerts**: Configurable via Prometheus alertmanager
- **Health**: `/health/live` and `/health/ready` probes