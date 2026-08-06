# Policy-0: Master Plan — From Prototype to Real App

> Author: Policy-0 engineering (planning artifact)
> Status: Proposed
> Prerequisite reading: `DEEP_PLAN.md`, `NVIDIA_STACK_MIGRATION_PLAN.md`

## 0. Honest baseline (read this first)

The current repo is a **strong single-application prototype**, not yet a real product. Gaps the plan addresses, verified in code:

| # | Gap | Evidence |
|---|-----|----------|
| G1 | Policies exist **only in browser memory**; nothing persisted server-side | `App.tsx:23` `useState<GeneratedPolicy[]>(INITIAL_POLICIES)` |
| G2 | "SQLite" store is actually **JSON files** | `server/data/sqliteStore.ts` header + whole file |
| G3 | Flywheel runs on **hard-coded templates + random roll**, not real telemetry | `deploymentCollector.ts:88-150`, `improvementEngine.ts:12-118` |
| G4 | Evolution **claims** higher success rate without re-simulating | `policyEvolution.ts:146` `projectedSuccess = before + Σgain*0.85` |
| G5 | Auth is **cosmetic**; JWT/passwords unused; no `/api/auth/*` | `AuthModal.tsx:36-40`, `server.ts` (no auth routes) |
| G6 | zod schemas **defined but not wired** to routes | `security.ts:73-247`; routes do manual `if (!x) return 400` |
| G7 | Rate limiters `strict`/`upload` **not attached**; only `general` global | `security.ts:36-71` |
| G8 | NVIDIA stack is real client code but **defaults to simulated/fallback** | all `USE_*` flags `false` in `.env.example`; `server.ts:1185` stub `{} as any` |
| G9 | `docker-compose.full.yml` references images/infra (**Isaac, Grafana dashboards, certs, nginx conf**) **not present** in repo | folder listing, compose volumes |
| G10 | CI `deploy-staging` step is a **placeholder echo** | `.github/workflows/ci.yml:149-153` |
| G11 | No README, no product/business/pricing/GTM doc | repo root listing |
| G12 | Vision terms (**Universal Language, Task-Space, IK/FK layer, MCP Database, Android-of-robotics**) **not in code** | full-codebase grep |

**One sentence strategy:** Stop polishing the demo loop. Lock scope to one proven vertical, make persistence + auth + real-integration + measured flywheel genuine, and **defer** the moat abstraction layer until real telemetry exists to justify it.

---

## 1. North-star decisions (decide these first)

1. **Scope wedge** — Start with **ONE robot (Franka Panda) + 3 manipulation tasks** end-to-end with a real GPU. Defer humanoids/hands in production. Everything else becomes "read-only catalog."
2. **Truthfulness of modes** — Split *simulation host* vs *mock host* **explicitly and visibly**. A policy generated in mock mode must be labeled `SIMULATED` in the UI and API; real mode is a separate deployment. Kill silent `{} as any` stub telemetry.
3. **Moat timing** — Do **not** build "Universal Language / MCP Database" now. Build the **policy-version store + real telemetry pipeline** first. Only once real deployments exist does a cross-robot data asset make sense.
4. **Persistence** — Postgres is already in compose (`docker-compose.full.yml:237`). Use it (via Prisma) as the single source of truth. JSON store becomes a **cold/mock fallback**.
5. **Deploy topologies** — Three explicit targets: Local (docker-compose, mock), Staging (single GPU node), Production (multi-node + NVIDIA DGX/OSMO). Never blur these.

---

## 2. Phase 1 — Truth & data model (days 1–5)

### 2.1 Persistence (Closes G1, G2)
- Add **Prisma + Postgres**. Map every existing JSON table to a real schema.
- **Core schema** (new authoritative models):
  - `Robot` (from `ROBOT_MODELS`, `mockData.ts:3-94`)
  - `Policy` (from `GeneratedPolicy`, `types.ts:138-169`) — **persist these**; include `mode: 'SIMULATED' | 'REAL'`
  - `PolicyVersion` (from `PolicyEvolutionRecord`, `types.ts:296-317`) with a `verified: boolean` column
  - `DeploymentRun`, `CategorizedFailure`, `ImprovementRecommendation` (already modeled, `dataStore.ts`)
  - `User`, `Organization`, `ApiKey`
  - `NvJob` (canonical record of every Isaac Sim / Lab / OSMO external call + status + artifacts)
- **Migration**: keep the JSON engine import-compatible as `SqliteMockStore` behind a `Persistence` interface; swap via `DATA_BACKEND=postgres|json`. Do not delete old JSON files until data migrated.
- **Uploads/exports**: move to object storage (S3-compatible) referenced by URL; never rely on local disk in prod.

### 2.2 Single source of truth
- `server.ts` currently returns generated policies and lets the browser own them (`App.tsx:249-259`). Change `/api/policy/generate` to **persist a `Policy` row** and return `{ policy, version }`; all later reads (ONNX, evolution, ROS package) go through the DB by `policyId`.

### 2.3 Mode labeling (Closes G3/G8/G12 visibility)
- Every pipeline response gains `mode: 'SIMULATED' | 'REAL'` and `nvidia: { used: bool, service: string|null }`.
- Frontend renders a persistent **SIMULATED** badge whenever mock path runs.

---

## 3. Phase 2 — Real auth & security (days 6–10)

### 3.1 Implement the auth that exists but is unused (Closes G5)
- Register routes from `auth.ts` helpers: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/register` (admin), `GET /api/auth/me`, `POST /api/auth/logout`.
- Store users + bcrypt hashes (`hashPassword`, `auth.ts:180`) in Postgres; refresh-token rotation; **rotate the hard-coded JWT secret** (`auth.ts:7`).
- Wire `authenticate`/`requireRole` onto the routes that touch data; keep `requireApiKey` for programmatic use.
- Delete the fake path in `AuthModal.tsx` — it must call the real login endpoint.

### 3.2 Enforce what is defined (Closes G6, G7)
- Apply `validateBody(schemas.X)` to every existing route (schemas already exist for nearly all: `security.ts:76-231`). Delete the ad-hoc `if (!title)` checks.
- Attach `strictRateLimiter` to `/api/policy/generate` + `/api/telemetry/*`, `uploadRateLimiter` to `/api/upload/video`.
- Move secrets (GEMINI, NVIDIA, JWT, POSTGRES, S3) to a **secret manager**; no `.env` in repo; no `${shell ...}` in compose (currently invalid syntax at `docker-compose.full.yml:67`).

---

## 4. Phase 3 — Real NVIDIA integration (days 11–20)

### 4.1 One verified vertical (Closes G8)
- Enable exactly one path with a **real NVIDIA API key** end-to-end: `Cosmos VLM → NIM LLM → Isaac Sim → LEAPP → Isaac ROS`. Target: Franka Panda, pick-and-place, 1080p.
- **Contract-lock every service**: create an `openapi`-style contract per service (`cosmosVLMAnalyzer.ts`, `nimLLM.ts`, `isaacSimBridge.ts`, `isaacLabBridge.ts`, `leappExporter.ts`, `osmoClient.ts`, `isaacSimVideoGenerator.ts`) and a recorded **cassette test** per service against the real endpoint.
- Replace every `SUCCESS` that is actually stubbed:
  - `generateSimulationTelemetryIsaacSim({} as any, ...)` → real telemetry from a completed sim job (`server.ts:1185,1192`).
  - `generateSimulatedRTXVideo` / `generateSimulatedLEAPPExport` → only reachable when `mode=MOCK`, not as silent fallback.
- Add a **`GET /api/nvidia/health`** that performs a real liveness call per configured service and reports per-service: `ok | miss | simulate`.

### 4.2 Make the "8-phase" claim accurate
- Rename the mental model from "8 NVIDIA phases wired" to **"NVIDIA stack: N of 8 production-verified."** Track it as a number, gated by cassette tests, not by `USE_*` flag existence.

---

## 5. Phase 4 — Measured flywheel (days 21–30)

The current loop is a demo. Make every step measurable and gated (Closes G3, G4).

### 5.1 Ingestion
- `/api/telemetry/collect` already anonymizes fingerprints (`deploymentCollector.ts:23-31`). Add:
  - `policy_version` to every run (link to `PolicyVersion`).
  - Signature/POE checks so telemetry can't be forged or fat-fingered.
- Replace `simulateDeploymentRun` random-roll with a **deterministic** path that only runs in mock mode.

### 5.2 Verify, don't assert
- **Add a verification stage** before a new version is marked `verified`:
  - `POST /api/evolution/regenerate` produces `v(next)`, persists it, then **submits it to Isaac Sim** and compares measured success against `v(current)`.
  - A version is promoted to verified **only if measured gain ≥ threshold** (e.g. +2pp) and no regression in safety signals.
  - Remove the arithmetic projection (`policyEvolution.ts:146`) from the *decision*; keep it only as a UI estimate labeled "projected."
- Gate auto-deploy on `verified && mode=REAL`; otherwise emit an **A/B recommendation**, not an auto-promotion.

### 5.3 Metrics surfacing
- Expose per-policy: measured pass-rate curve across versions, gain-per-version, and **sim-to-real gap** (sim success vs real success from `DeploymentRun.source`, `types.ts:216`). This sim-to-real metric is the honest version of the "data moat."

---

## 6. Phase 5 — The moat layer (deferred, after 100 real deployments)

Only begin when `DeploymentRun(source=real_world)` count and diversity justify it. Design first, build second:

- **Task-Space representation**: a versioned, robot-agnostic normalized task/interaction descriptor derived from `VLMAnalysisResult` + `TaskInput`. This is the only defensible abstraction and it requires real task variety to learn from.
- **Policy store / retrieval**: indexed by (task-space embedding, robot capability, environment fingerprint) enabling **cross-robot transfer** ("learned on Franka, retrieved fine-tuned for UR5e"). Closed-source only in the sense of hosted, not shipped; **do not** claim closed-source for code that's public.
- **Self-hosted telemetry lake** with per-tenant isolation + anonymization guarantees (privacy is the adoption blocker; make consent explicit).

Until this phase, **"the MCP Database" and "Universal Language" are not shipped capabilities** — they are roadmap items.

---

## 7. Phase 6 — Operate like a real app (days 31–45)

Closes G9, G10, and makes it survivable.

### 7.1 Tests
- Flesh out the unit tests already present (`server/pipeline/*.test.ts`). Make `server/integration.test.ts` newthe **mock-path contract suite**; add a **real-path suite** tagged `@real` that runs only in staging with valid keys (skipped in CI by default).
- Target: unit fast + green on every PR; `@real` green weekly in staging.

### 7.2 CI/CD
- Fix the placeholder `deploy-staging` (`ci.yml:149-153`) to a real redeploy (compose/SSH or `kubectl`).
- Add migrations as a CI step, artifact versioning, and a rollback job. Secret-based, no hard-coded defaults.

### 7.3 Observability (from DEEP_PLAN Week 2)
- Implement `/metrics` (Prometheus), `/health/live`, `/health/ready`; connect `prometheus.yml` + Grafana dashboards (create the `grafana/` dir that compose expects — currently missing).
- Structured error taxonomy: distinguish **NVIDIA outage** vs **policy failure** vs **infra failure** so the flywheel never mistakes a sim outage for a policy failure.

### 7.4 Deploy
- Provide a **real, GPU-capable staging** compose profile. Replace the un-owned image references (`nvcr.io/nvidia/isaac-sim:2024.1`) with a documented pull/registry process and a GPU node. Add the missing `nginx/` config and certs off-repo (secrets).
- Auth + TLS at the proxy; admin-only provisioning; audit log on all data-mutating routes.

---

## 8. What NOT to build (avoid these now)

1. **Universal Language / MCP Database** — premature; no data to learn from.
2. **Humanoid + dexterous-hand live support** — keep as catalog only (high sim cost, low reliability).
3. **Multi-tenancy SaaS** — build single-tenant (self-host) first; SaaS later.
4. **More robots** — hurtles the wedge. One robot wins proof.
5. **Rewriting "images."** The Dockerfile multi-stage is fine; don't gold-plate.
6. **Fabricating more "production verification."** Any claim must map to a cassette test and a `mode`.

---

## 9. Milestones & gates

| Milestone | Definition of done | Gate to next |
|-----------|--------------------|--------------|
| M1 Persistence | Policies + versions + runs survive restart; Postgres live; JSON is a labeled fallback | All data routes read/write DB |
| M2 Auth+hardening | Real login/refresh/RBAC; zod + rate limits enforced on all routes; no `if(!x)` checks left | Auth suite green |
| M3 One real vertical | Cassette-tested real NVIDIA path for Franka pick-and-place; `GET /api/nvidia/health` all-ok-or-explicit-SIMULATED | `@real` suite green in staging |
| M4 Measured flywheel | Version promoted only after measured sim re-verify; no arithmetic auto-promotion | 50 real runs collected |
| M5 Operations | CI real deploy, observability, TLS, migration on deploy, rollback | Staging stable 48h |
| M6 Moat layer (Go/No-Go) | ≥100 `source=real` runs across ≥3 tasks | Foundational design approved |

**Recommended Go/No-Go for the product** is **M3**: if a real NVIDIA path with a real key cannot be made green and labeled honestly in 20 days, re-scope the wedge (different robot/task) before touching the moat.

---

## 10. Risk register (updated from DEEP_PLAN)

| Risk | Prob | Impact | Mitigation |
|------|------|--------|------------|
| NVIDIA key/quota unavailable → integration stalls | High | High | Fall back to labeled MOCK modes; wedge on another service; get Inception credits before M3 |
| JSON→Postgres migration corrupts data | Med | High | Freeze writes during migration; keep JSON read-only backup; test migration replay |
| Evolution auto-promotes regression | Med | High | **Measured re-sim gate (5.2)**; no arithmetic-only promotion |
| Sim outage counted as policy failure (flywheel poisoned) | High | High | Error taxonomy (7.3); never classify `upstream error` as `contact_jam` |
| Cost of GPU staging ($30-100/hr) | High | Med | Spot instances; wedge limits to 1 robot/3 tasks; idle-shutdown |
| Founder overclaims ("production-ready"/"Universal Language") | Med | High | Every capability maps to cassette test + `mode` label; README states what's real |

---

## 11. Immediate next 5 actions

1. Add Prisma + `POLICY0_DATABASE_URL`; define the `Policy`/`PolicyVersion` schema; write the M1 migration.
2. Wire `validateBody` + `authenticate` + rate limiters onto all existing routes (fastest real-Security win).
3. Register the real `/api/auth/*` endpoints backed by Postgres users; delete the fake AuthModal path.
4. Replace the two `{} as any` stub telemetry calls with a `getSimDemoTelemetry()` marked `SIMULATED`, and add `mode` to responses.
5. Rewrite CI `deploy-staging` + fill missing `grafana/` + nginx/certs so compose runs a real GPU staging stack.

---

> **Restate the plan in one line:** Make one real vertical truthful and durable (persistence → auth → verification → a living, genetic flywheel), label mock vs real everywhere, and postpone the moat abstraction until real telemetry earns it.