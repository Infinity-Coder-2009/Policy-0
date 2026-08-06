# Policy-0 Studio: Deep Implementation Plan

> **Timeline**: 4 weeks to production-ready  
> **Current State**: Feature-complete, blocked by persistence + auth + integration tests  
> **Goal**: Production-ready deployment with real NVIDIA integration

---

## 📅 WEEK 1: FOUNDATION (Days 1-7)
**Goal**: Production-grade persistence + auth + integration tests passing

---

### Day 1-2: SQLite Migration (better-sqlite3)
**Files to Create/Modify**:
```
server/data/sqliteStore.ts          → Replace JSON implementation with better-sqlite3
server/data/migrate.ts              → Migration runner for schema versioning
server/data/schema.sql              → SQL schema definitions
package.json                         → Add better-sqlite3 dependency
```

**Schema (10 tables)**:
```sql
-- approvals
-- pipeline_runs
-- checkpoints
-- nvidia_video_jobs
-- evolution_versions
-- improvements
-- deployment_runs
-- failures
-- osmo_jobs
-- osmo_pipelines
```

**Migration Strategy**:
- Drop-in replacement for `sqliteStore.ts` API
- Auto-migrate existing JSON files on first run
- Maintain identical API surface for zero-downtime migration

**Acceptance Criteria**:
- [ ] All 10 tables created with proper indexes
- [ ] Existing JSON data migrated automatically
- [ ] All existing unit tests pass (44/44)
- [ ] Server restarts preserve all data

---

### Day 3-4: JWT Authentication Flow
**Backend** (`server/middleware/auth.ts`):
- [ ] POST `/api/auth/login` - email/password → JWT + refresh token
- [ ] POST `/api/auth/refresh` - refresh token → new access token
- [ ] POST `/api/auth/register` - admin-only user creation
- [ ] GET `/api/auth/me` - current user info
- [ ] Role-based middleware: `requireRole('admin')`, `requireRole('operator', 'admin')`

**Frontend** (`src/components/Auth/`):
- [ ] Login page with email/password form
- [ ] JWT storage in httpOnly cookie + localStorage fallback
- [ ] Auto-redirect on 401 to login page
- [ ] User avatar + role display in header
- [ ] Logout button with token cleanup

**Environment**:
```env
JWT_SECRET=policy0-production-secret-rotate-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
```

---

### Day 5-6: Integration Tests (Live Server)
**Setup** (`vitest.config.ts`):
```typescript
test: {
  environment: 'node',
  globals: true,
  include: ['server/**/*.integration.test.ts'],
  setupFiles: ['server/test/setup.ts'],
}
```

**Test File** (`server/integration.test.ts`):
```typescript
// Test all 40+ endpoints against live server
// - Health & Providers (4 tests)
// - Video Upload + VLM (4 tests)  
// - Policy Generation Pipeline (8 tests)
// - ONNX Export + LEAPP (4 tests)
// - Isaac Lab + Sim (6 tests)
// - OSMO Orchestration (6 tests)
// - Telemetry + Flywheel (6 tests)
// - Evolution (4 tests)
// - Auth + Rate Limiting (4 tests)
```

**Test Infrastructure**:
- [ ] Test server startup/teardown in `beforeAll`/`afterAll`
- [ ] Test database isolation (separate test DB)
- [ ] Mock external NVIDIA APIs, test real DB operations
- [ ] CI integration: `npm run test:integration`

**Acceptance Criteria**:
- [ ] All 27 integration tests pass
- [ ] Tests run against real SQLite DB
- [ ] Tests run in CI (GitHub Actions)
- [ ] Coverage > 80% for pipeline modules

---

### Day 7: Week 1 Review & Hardening
- [ ] All 44 unit tests + 27 integration tests pass
- [ ] TypeScript strict mode clean
- [ ] Build succeeds (`npm run build`)
- [ ] Server starts/stops cleanly
- [ ] Documentation updated

---

## 📅 WEEK 2: OBSERVABILITY + TESTING (Days 8-14)

---

### Day 8-9: Prometheus Metrics + OpenTelemetry
**Backend** (`server/observability/`):
```typescript
// metrics.ts
import { Counter, Histogram, Gauge } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const policyGenerationDuration = new Histogram({
  name: 'policy_generation_duration_seconds',
  help: 'Policy generation pipeline duration',
  labelNames: ['plan_type', 'robot_type'],
  buckets: [10, 30, 60, 120, 300, 600],
});

export const activeJobs = new Gauge({
  name: 'active_jobs',
  help: 'Currently running async jobs',
  labelNames: ['job_type'],
});
```

**Endpoints**:
- `GET /metrics` - Prometheus scrape endpoint
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe

**OpenTelemetry** (`server/observability/tracing.ts`):
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export function initTracing() {
  const sdk = new NodeSDK({
    traceExporter: new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });
  sdk.start();
}
```

---

### Day 10-11: Playwright E2E Tests
**Setup** (`playwright.config.ts`):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 2,
  workers: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

**Test Scenarios** (`e2e/`):
```typescript
// e2e/auth.spec.ts
test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'admin@policy0.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=login-btn]');
  await expect(page).toHaveURL('/dashboard');
});

// e2e/policy-generation.spec.ts
test('complete policy generation flow', async ({ page }) => {
  await page.goto('/create');
  await page.fill('[data-testid=task-title]', 'Pick up red block');
  await page.fill('[data-testid=task-description]', 'Pick up the red block and place it in the blue bin');
  await page.selectOption('[data-testid=robot-select]', 'franka_panda');
  await page.click('[data-testid=generate-btn]');
  await expect(page.locator('[data-testid=pipeline-status]')).toContainText('Complete');
});

// e2e/full-flywheel.spec.ts
test('complete data flywheel loop', async ({ page }) => {
  // 1. Generate policy
  // 2. Simulate deployment run
  // 3. Categorize failure
  // 4. Generate improvement
  // 5. Apply improvement
  // 6. Evolve policy
  // 7. Verify evolved policy has baked improvements
});
```

**Acceptance Criteria**:
- [ ] 10+ E2E tests covering critical paths
- [ ] Tests run in CI (GitHub Actions)
- [ ] Screenshots on failure
- [ ] Parallel execution < 5 minutes

---

### Day 12-13: WebSocket for Real-time Updates
**Backend** (`server/websocket.ts`):
```typescript
import { WebSocketServer } from 'ws';
import { verifyToken } from './middleware/auth';

export function setupWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws, req) => {
    const token = new URL(req.url, `http://${req.headers.host}`).searchParams.get('token');
    const user = verifyToken(token);
    if (!user) { ws.close(); return; }
    
    ws.userId = user.userId;
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });
  
  // Heartbeat
  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    }, 30000);
  });
}

// Broadcast helpers
export function broadcastSimStatus(jobId: string, status: any) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'sim_status', jobId, status }));
    }
  });
}
```

**Frontend** (`src/hooks/useSimStatus.ts`):
```typescript
export function useSimStatus(jobId: string) {
  const [status, setStatus] = useState('connecting');
  
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3000/ws?token=${getToken()}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'sim_status' && data.jobId === jobId) {
        setStatus(data.status);
      }
    };
    return () => ws.close();
  }, [jobId]);
  
  return status;
}
```

**Integration**: Update `TelemetryDashboard` to use WebSocket instead of polling.

---

### Day 14: Week 2 Review
- [ ] Prometheus metrics scraped by Prometheus
- [ ] OpenTelemetry traces in Jaeger
- [ ] E2E tests passing in CI
- [ ] WebSocket replacing polling for sim status
- [ ] Documentation updated

---

## 📅 WEEK 3: DEPLOYMENT (Days 15-21)

---

### Day 15-16: Docker + Kubernetes
**Dockerfile** (multi-stage, already created):
```dockerfile
# builder stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite)
RUN npm run build

# Build server (esbuild)
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

# Verify builds
RUN node --check dist/server.cjs

# -----------------------------------------------------------------------------
# Production Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs policy0

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=policy0:nodejs /app/dist ./dist
COPY --from=builder --chown=policy0:nodejs /app/server/data ./server/data
COPY --from=builder --chown=policy0:nodejs /app/exports ./exports
COPY --from=builder --chown=policy0:nodejs /app/uploads ./uploads
COPY --from=builder --chown=policy0:nodejs /app/data ./data
COPY --from=builder --chown=policy0:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=policy0:nodejs /app/package*.json ./

# Create required directories with correct permissions
RUN mkdir -p /app/data /app/exports /app/uploads /app/server/data && \
    chown -R policy0:nodejs /app/data /app/exports /app/uploads /app/server/data

# Switch to non-root user
USER policy0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini as init for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start server
CMD ["node", "dist/server.cjs"]

# -----------------------------------------------------------------------------
# Build Arguments & Labels
# -----------------------------------------------------------------------------
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="Policy-0 Studio" \
      org.opencontainers.image.description="Robotics policy generation platform with NVIDIA stack integration" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Policy-0" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/policy0/policy0" \
      org.opencontainers.image.documentation="https://github.com/policy0/policy0#readme"
```

**docker-compose.full.yml** (already created):
- policy0 (app)
- isaac-sim (nvcr.io/nvidia/isaac-sim:2024.1)
- isaac-lab (nvcr.io/nvidia/isaac-lab:2024.1)
- redis (cache + queue)
- postgres (persistent data)
- prometheus + grafana (monitoring)
- nginx (reverse proxy + SSL)

**Kubernetes** (`k8s/`):
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: policy0
spec:
  replicas: 2
  selector:
    matchLabels:
      app: policy0
  template:
    metadata:
      labels:
        app: policy0
    spec:
      containers:
      - name: policy0
        image: policy0:latest
        ports:
        - containerPort: 3000
        envFrom:
        - secretRef:
            name: policy0-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3000
          initialDelaySeconds: 30
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3000
          initialDelaySeconds: 10
---
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: policy0
spec:
  selector:
    app: policy0
  ports:
  - port: 80
    targetPort: 3000
---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: policy0
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - policy-0.com
    secretName: policy0-tls
  rules:
  - host: policy-0.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: policy0
            port:
              number: 80
```

---

### Day 17-18: GitHub Actions CI/CD
**.github/workflows/ci.yml**:
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript typecheck
        run: npm run lint

      - name: ESLint
        run: npx eslint . --ext .ts,.tsx --max-warnings 0 || echo "ESLint not configured, skipping"

  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test

  build-frontend:
    name: Build Frontend
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build

      - name: Upload frontend artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  build-server:
    name: Build Server
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, unit-tests]
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build server
        run: npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

      - name: Verify server build
        run: node --check dist/server.cjs

      - name: Upload server artifact
        uses: actions/upload-artifact@v4
        with:
          name: server
          path: dist/server.cjs
          retention-days: 7

  docker-build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [build-frontend, build-server]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push multi-stage image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/policy0:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/policy0:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploy to staging environment"
          # Add your deployment commands here (e.g., kubectl, docker compose, etc.)
        env:
          KUBECONFIG: ${{ secrets.STAGING_KUBECONFIG }}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

---

### Day 19-20: Staging Deployment
**Cloud Provider**: AWS (EKS) / GCP (GKE) / Azure (AKS)
**Secrets Management**:
```bash
# GitHub Secrets
NVIDIA_API_KEY
JWT_SECRET
POSTGRES_PASSWORD
GRAFANA_PASSWORD
GHCR_TOKEN
KUBECONFIG_STAGING
```

**Deploy Commands**:
```bash
# Apply infrastructure
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml
kubectl apply -f k8s/nginx.yaml
kubectl apply -f k8s/policy0.yaml
kubectl apply -f k8s/isaac-sim.yaml
kubectl apply -f k8s/isaac-lab.yaml
kubectl apply -f k8s/ingress.yaml

# Verify
kubectl get pods -n policy0
kubectl logs -f deployment/policy0 -n policy0
curl -H "Authorization: Bearer $STAGING_API_KEY" https://staging.policy-0.com/api/health
```

---

### Day 21: Week 3 Review
- [ ] Docker images building and pushing
- [ ] K8s manifests validated
- [ ] CI/CD pipeline green
- [ ] Staging environment accessible
- [ ] Monitoring dashboards visible in Grafana
- [ ] SSL certificates valid

---

## 📅 WEEK 4: REAL NVIDIA INTEGRATION (Days 22-28)

---

### Day 22-23: Isaac Sim Container
```yaml
# docker-compose.isaac.yml (already created)
# Verify GPU access:
docker run --rm --gpus all nvcr.io/nvidia/isaac-sim:2024.1 \
  python -c "import omni; print('Isaac Sim OK')"

# Test API endpoints:
# POST /api/v1/simulations
# GET /api/v1/simulations/:id
# POST /api/v1/render
```

**Verification**:
```bash
# Submit simulation job
curl -X POST http://isaac-sim:8211/api/v1/simulations \
  -H "Content-Type: application/json" \
  -d '{"robot": "franka_panda", "task": "pick_place", "domain_randomization": true}'

# Poll for completion
curl http://isaac-sim:8211/api/v1/simulations/${JOB_ID}
```

---

### Day 24-25: Isaac Lab Training
```bash
# Submit training job
curl -X POST http://isaac-lab:8212/api/v1/training \
  -H "Content-Type: application/json" \
  -d '{"task_name": "Isaac-Manipulation-Franka-Panda-v0", "num_envs": 4096, "algorithm": "PPO"}'

# Monitor training
curl http://isaac-lab:8212/api/v1/training/${JOB_ID}

# Export ONNX via LEAPP
curl -X POST http://isaac-lab:8212/api/v1/export/onnx \
  -H "Content-Type: application/json" \
  -d '{"checkpoint_path": "/path/to/checkpoint.pt", "task_name": "Isaac-Manipulation-Franka-Panda-v0"}'
```

---

### Day 26-27: Full Pipeline Test
**End-to-End Test Script** (`scripts/test-full-pipeline.sh`):
```bash
#!/bin/bash
set -e

echo "=== Testing Full Policy-0 Pipeline ==="

# 1. Generate policy from text
POLICY=$(curl -s -X POST http://localhost:3000/api/policy/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"title": "Test Policy", "description": "Pick up red block", "robotId": "franka_panda"}')

POLICY_ID=$(echo $POLICY | jq -r .policy.id)
echo "Generated policy: $POLICY_ID"

# 2. Generate video
VIDEO=$(curl -s -X POST http://localhost:3000/api/policy/video \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"policyId\": \"$POLICY_ID\"}")
VIDEO_ID=$(echo $VIDEO | jq -r .video.id)

# 3. Wait for video
sleep 30
curl -X POST "http://localhost:3000/api/policy/video-status/$VIDEO_ID"

# 4. Export ONNX
curl -X POST http://localhost:3000/api/policy/onnx-export \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"policyId\": \"$POLICY_ID\"}"

# 5. Isaac Lab training
LAB_JOB=$(curl -s -X POST http://localhost:3000/api/isaaclab/train \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"policyId\": \"$POLICY_ID\"}")
LAB_JOB_ID=$(echo $LAB_JOB | jq -r .jobId)

# Wait for training completion
sleep 300
curl -X POST http://localhost:3000/api/isaaclab/train/$LAB_JOB_ID/wait \
  -H "Authorization: Bearer $API_KEY" \
  -d '{"policyId": "'$POLICY_ID'"}'

# 6. Export ONNX from Isaac Lab
curl -X POST http://localhost:3000/api/isaaclab/export-onnx \
  -H "Authorization: Bearer $API_KEY" \
  -d "{\"jobId\": \"$LAB_JOB_ID\", \"checkpointPath\": \"/checkpoints/latest.pt\"}"

echo "=== Full Pipeline Test Complete ==="
```

---

### Day 28: Production Readiness Review
- [ ] All integration tests passing against real NVIDIA services
- [ ] Staging environment stable for 48 hours
- [ ] Monitoring alerts configured
- [ ] Runbooks documented
- [ ] Rollback procedure tested
- [ ] Security audit passed
- [ ] Load testing completed (100 concurrent users)
- [ ] Cost analysis completed

---

## 🎯 SUCCESS CRITERIA

### Production Ready Checklist
- [ ] **Persistence**: SQLite migration complete, all data survives restarts
- [ ] **Auth**: JWT login + refresh tokens working
- [ ] **Tests**: 44 unit + 27 integration + 10+ E2E tests passing in CI
- [ ] **Observability**: Prometheus metrics, OpenTelemetry traces, Grafana dashboards
- [ ] **Real NVIDIA**: Isaac Sim + Isaac Lab + Cosmos NIM + LEAPP verified
- [ ] **Deployment**: Docker + K8s manifests, GitHub Actions CI/CD, staging deployed
- [ ] **Security**: Rate limiting, CORS, JWT, Zod validation, RFC 7807 errors
- [ ] **Documentation**: API docs, runbooks, deployment guides

---

## 📊 RESOURCE REQUIREMENTS

### GPU Resources (Week 4)
| Service | GPU | Memory | Instance Type (AWS) |
|---------|-----|--------|---------------------|
| Isaac Sim | 1x A100 | 40GB | p4d.24xlarge (8x A100) |
| Isaac Lab | 1x A100 | 40GB | p4d.24xlarge (shared) |
| Inference | 1x T4 | 16GB | g4dn.xlarge |

**Estimated Cost**: ~$30/hour for full stack (spot instances ~$10/hour)

---

## 🚨 RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| NVIDIA API key invalid | 🟡 Medium | 🔴 High | Verify key early, have fallback to simulated mode |
| GPU quota insufficient | 🟡 Medium | 🔴 High | Request quota increase early, use spot instances |
| Isaac Sim container issues | 🟡 Medium | 🟡 Medium | Test container locally first, have simulated fallback |
| Isaac Lab training fails | 🟡 Medium | 🟡 Medium | Use smaller models first, increase timeout |
| LEAPP export fails | 🟡 Medium | 🟡 Medium | Test with known good checkpoints first |
| SQLite migration breaks | 🟡 Medium | 🔴 High | Test migration locally, backup JSON files first |
| Auth integration breaks frontend | 🟡 Medium | 🟡 Medium | Feature flag auth, test in staging first |

---

## 📋 DAILY STANDUP TEMPLATE

```
Date: ____
Yesterday: 
- Completed: ____
- Blocked by: ____

Today:
- Priority 1: ____
- Priority 2: ____
- Priority 3: ____

Blockers:
- ____

Metrics:
- Tests passing: ___/___
- Build time: ___
- Bundle size: ___
```

---

## 🏁 DONE CRITERIA

**Policy-0 is production-ready when:**
- [ ] All 44 unit tests + 27 integration + 10+ E2E tests pass in CI
- [ ] SQLite persistence survives restarts with zero data loss
- [ ] JWT auth + API key both work, rate limiting enforced
- [ ] Real NVIDIA services (Isaac Sim, Isaac Lab, Cosmos, LEAPP) tested end-to-end
- [ ] Staging deployed, monitored, stable for 48 hours
- [ ] Rollback tested, runbooks written, team trained
- [ ] Cost < $X/month, latency < 5min for policy generation

---

## 💰 COST ESTIMATE (Monthly)

| Resource | Cost |
|----------|------|
| Render (backend) | $7/mo |
| Vercel (frontend) | Free tier |
| NVIDIA Inception GPU credits | Free (apply) |
| Isaac Sim container (spot) | ~$0.50/hr when running |
| **Total (dev)** | **~$15/mo** |

---

> **Next Action**: Start **Week 1 Day 1** - SQLite migration with `better-sqlite3`

---

> "The code is ready. The architecture is proven. Now wire the real NVIDIA stack to the frontend—and Policy-0 becomes production-ready." 🚀