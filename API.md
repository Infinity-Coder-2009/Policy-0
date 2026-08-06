# Policy-0 API Reference

> Complete API documentation for all endpoints

## Base URL

```
Production: https://policy-0-backend.onrender.com
Local: http://localhost:2009
```

## Authentication

All API requests require:
- **Header**: `Authorization: Bearer <jwt_token>`
- **Header**: `x-api-key: <api_key>`

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response 200:
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "role": "operator"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}

Response 200:
{
  "success": true,
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>

{
  "refreshToken": "eyJ..."
}

Response 200:
{
  "success": true
}
```

## Policies

### Generate Policy
```http
POST /api/policy/generate
Authorization: Bearer <token>

{
  "title": "Pick and Place",
  "description": "Pick up a red cube and place it in a box",
  "robotId": "franka_panda",
  "robotDof": 7,
  "controlMode": "Cartesian Impedance",
  "environment": "MuJoCo",
  "domainRandomization": true,
  "observationSpace": ["RGB Camera", "Joint Encoders"]
}

Response 200:
{
  "success": true,
  "policy": {
    "id": "pol_xxx",
    "title": "Pick and Place",
    "pythonCode": "...",
    "mujocoXml": "...",
    "metrics": {
      "successRatePct": 94.5
    }
  }
}
```

### List Policies
```http
GET /api/policies
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "count": 42,
  "policies": [...]
}
```

### Get Policy
```http
GET /api/policy/:id
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "policy": {...},
  "mode": "SIMULATED",
  "versions": [...]
}
```

### Delete Policy
```http
DELETE /api/policy/:id
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "deleted": "pol_xxx"
}
```

## Evolution

### Regenerate (Evolve)
```http
POST /api/evolution/regenerate
Authorization: Bearer <token>

{
  "policy": {...}
}

Response 200:
{
  "success": true,
  "policy": {...},
  "record": {
    "version": 2,
    "verified": true,
    "measuredSuccessRatePct": 96.2
  },
  "verification": {
    "verified": true,
    "measuredSuccessRatePct": 96.2,
    "thresholdPp": 2.0,
    "canAutoDeploy": false
  }
}
```

### Success Rate Curve
```http
GET /api/evolution/curve/:policyId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "curve": [
    { "version": 1, "projected": 90.6, "measured": 89.2, "verified": true },
    { "version": 2, "projected": 95.1, "measured": 96.2, "verified": true }
  ]
}
```

### Sim-to-Real Gap
```http
GET /api/evolution/gap/:policyId
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "gap": {
    "policyId": "pol_xxx",
    "simSuccessRatePct": 96.2,
    "realSuccessRatePct": 87.5,
    "gapPct": 8.7,
    "deployments": 12
  }
}
```

## Telemetry

### Collect Deployment Run
```http
POST /api/telemetry/collect
Authorization: Bearer <token>

{
  "policyId": "pol_xxx",
  "outcome": "success",
  "successScore": 94.5,
  "source": "sim"
}

Response 200:
{
  "success": true,
  "run": {...}
}
```

### Get Stats
```http
GET /api/telemetry/stats
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "stats": {
    "totalRuns": 156,
    "successRate": 87.3,
    "avgDuration": 4.2
  }
}
```

## NVIDIA

### Health Check
```http
GET /api/nvidia/health
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "overall": "ok",
  "checks": {
    "cosmos_reasoner_nim": { "status": "ok", "latencyMs": 245 },
    "nim_llm": { "status": "ok", "latencyMs": 189 },
    "isaac_sim": { "status": "down", "error": "connection refused" }
  }
}
```

## System

### Health (Liveness)
```http
GET /health/live

Response 200:
{ "status": "alive", "timestamp": "2025-01-01T00:00:00Z" }
```

### Readiness
```http
GET /health/ready

Response 200:
{ "status": "ready", "checks": { "persistence": true } }
```

### Prometheus Metrics
```http
GET /metrics

Response 200 (text/plain):
# HELP policy0_requests_total Total HTTP requests
policy0_requests_total 1234
...
```

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `INVALID_API_KEY` | 401 | Missing or invalid API key |
| `TOKEN_EXPIRED` | 401 | JWT token expired |
| `INVALID_TOKEN` | 401 | Invalid JWT token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_FAILED` | 400 | Request body validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| General | 100 req/min |
| `/api/policy/generate` | 20 req/min |
| `/api/telemetry/*` | 20 req/min |
| `/api/upload/video` | 10 req/min |