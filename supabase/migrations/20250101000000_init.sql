-- =============================================================================
-- Policy-0 Database Schema
-- =============================================================================
-- Initial migration for PostgreSQL (Supabase)
-- Generated from prisma/schema.prisma
-- =============================================================================

-- ===== Enums =====
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OPERATOR', 'VIEWER');
CREATE TYPE "Mode" AS ENUM ('SIMULATED', 'REAL');
CREATE TYPE "RunSource" AS ENUM ('SIMULATED', 'ISAAC_SIM', 'ISAAC_LAB', 'OSMO', 'REAL_WORLD');
CREATE TYPE "RunStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "FailureCategory" AS ENUM (
  'CONTACT_JAM', 'IK_SINGULARITY', 'COLLISION', 'TIMEOUT', 'JOINT_LIMIT',
  'PERCEPTION', 'PLANNING', 'SIMULATION_ARTIFACT', 'UNKNOWN'
);
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- ===== Users =====
CREATE TABLE "users" (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          "Role" NOT NULL DEFAULT 'OPERATOR',
  name          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON "users"(email);

-- ===== Refresh Tokens =====
CREATE TABLE "refresh_tokens" (
  id         TEXT PRIMARY KEY,
  token_hash TEXT UNIQUE NOT NULL,
  user_id    TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_refresh_tokens_user_id ON "refresh_tokens"(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON "refresh_tokens"(token_hash);

-- ===== API Keys =====
CREATE TABLE "api_keys" (
  id         TEXT PRIMARY KEY,
  key_hash   TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  user_id    TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  last_used  TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_user_id ON "api_keys"(user_id);
CREATE INDEX idx_api_keys_key_hash ON "api_keys"(key_hash);

-- ===== Organizations =====
CREATE TABLE "organizations" (
  id         TEXT PRIMARY KEY,
  name       TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Robots =====
CREATE TABLE "robots" (
  id           TEXT PRIMARY KEY,
  name         TEXT UNIQUE NOT NULL,
  type         TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  dof          INTEGER NOT NULL,
  payload_kg   REAL NOT NULL,
  reach_mm     INTEGER NOT NULL,
  description  TEXT,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_robots_name ON "robots"(name);

-- ===== Policies =====
CREATE TABLE "policies" (
  id         TEXT PRIMARY KEY,
  policy     JSONB NOT NULL,
  mode       "Mode" NOT NULL DEFAULT 'SIMULATED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_mode ON "policies"(mode);
CREATE INDEX idx_policies_created_at ON "policies"(created_at);

-- ===== Policy Versions =====
CREATE TABLE "policy_versions" (
  id                    TEXT PRIMARY KEY,
  policy_id             TEXT NOT NULL REFERENCES "policies"(id) ON DELETE CASCADE,
  version               INTEGER NOT NULL,
  policy_json           JSONB NOT NULL,
  verified              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_versions_policy_id ON "policy_versions"(policy_id);
CREATE UNIQUE INDEX idx_policy_versions_policy_version ON "policy_versions"(policy_id, version);

-- ===== Deployment Runs =====
CREATE TABLE "deployment_runs" (
  id                TEXT PRIMARY KEY,
  policy_version_id TEXT REFERENCES "policy_versions"(id) ON DELETE SET NULL,
  source            "RunSource" NOT NULL DEFAULT 'SIMULATED',
  status            "RunStatus" NOT NULL DEFAULT 'PENDING',
  success           BOOLEAN,
  metrics           JSONB,
  error             TEXT,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at      TIMESTAMPTZ
);

CREATE INDEX idx_deployment_runs_policy_version_id ON "deployment_runs"(policy_version_id);
CREATE INDEX idx_deployment_runs_status ON "deployment_runs"(status);
CREATE INDEX idx_deployment_runs_source ON "deployment_runs"(source);

-- ===== Categorized Failures =====
CREATE TABLE "categorized_failures" (
  id          TEXT PRIMARY KEY,
  run_id      TEXT NOT NULL REFERENCES "deployment_runs"(id) ON DELETE CASCADE,
  category    "FailureCategory" NOT NULL,
  description TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categorized_failures_run_id ON "categorized_failures"(run_id);
CREATE INDEX idx_categorized_failures_category ON "categorized_failures"(category);

-- ===== Improvement Recommendations =====
CREATE TABLE "improvement_recommendations" (
  id              TEXT PRIMARY KEY,
  run_id          TEXT REFERENCES "deployment_runs"(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  priority        "Priority" NOT NULL DEFAULT 'MEDIUM',
  category        TEXT NOT NULL,
  estimated_gain  REAL,
  applied_at      TIMESTAMPTZ,
  applied_version INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_improvements_run_id ON "improvement_recommendations"(run_id);
CREATE INDEX idx_improvements_priority ON "improvement_recommendations"(priority);
CREATE INDEX idx_improvements_applied ON "improvement_recommendations"(applied_at);

-- ===== NVIDIA Jobs =====
CREATE TABLE "nvidia_jobs" (
  id           TEXT PRIMARY KEY,
  job_id       TEXT UNIQUE NOT NULL,
  service      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING',
  payload      JSONB,
  result       JSONB,
  error        TEXT,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_nvidia_jobs_job_id ON "nvidia_jobs"(job_id);
CREATE INDEX idx_nvidia_jobs_service ON "nvidia_jobs"(service);
CREATE INDEX idx_nvidia_jobs_status ON "nvidia_jobs"(status);

-- ===== Audit Log =====
CREATE TABLE "audit_logs" (
  id          TEXT PRIMARY KEY,
  user_id     TEXT REFERENCES "users"(id) ON DELETE SET NULL,
  user_email  TEXT,
  user_role   "Role",
  action      TEXT NOT NULL,
  resource    TEXT NOT NULL,
  resource_id TEXT,
  method      TEXT NOT NULL,
  path        TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON "audit_logs"(user_id);
CREATE INDEX idx_audit_logs_action ON "audit_logs"(action);
CREATE INDEX idx_audit_logs_resource ON "audit_logs"(resource);
CREATE INDEX idx_audit_logs_created_at ON "audit_logs"(created_at);

-- ===== Row Level Security (RLS) =====
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "refresh_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "policy_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deployment_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categorized_failures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "improvement_recommendations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "nvidia_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;

-- ===== Updated At Trigger =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_robots_updated_at BEFORE UPDATE ON "robots"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON "policies"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();