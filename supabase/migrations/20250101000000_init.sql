-- =============================================================================
-- Policy-0 Database Schema for Supabase
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== Users Table =====
-- Managed by Clerk, but we store additional metadata
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'viewer')),
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON public.users(clerk_user_id);
CREATE INDEX idx_users_email ON public.users(email);

-- ===== Policies Table =====
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'SIMULATED' CHECK (mode IN ('SIMULATED', 'REAL')),
  robot_type TEXT,
  task_description TEXT,
  control_mode TEXT,
  observation_space JSONB,
  domain_randomization BOOLEAN DEFAULT FALSE,
  success_rate_pct REAL,
  policy_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policies_user_id ON public.users(id);
CREATE INDEX idx_policies_mode ON public.policies(mode);

-- ===== Policy Versions Table =====
CREATE TABLE IF NOT EXISTS public.policy_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  changes JSONB,
  success_rate_before REAL,
  success_rate_after REAL,
  measured_success_rate REAL,
  projected_success_rate REAL,
  verified BOOLEAN DEFAULT FALSE,
  verification_job_id TEXT,
  policy_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_policy_versions_policy_id ON public.policy_versions(policy_id);
CREATE UNIQUE INDEX idx_policy_versions_unique ON public.policy_versions(policy_id, version);

-- ===== Deployment Runs Table =====
CREATE TABLE IF NOT EXISTS public.deployment_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE SET NULL,
  policy_version_id UUID REFERENCES public.policy_versions(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'SIMULATED' CHECK (source IN ('SIMULATED', 'ISAAC_SIM', 'ISAAC_LAB', 'OSMO', 'REAL_WORLD')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  success BOOLEAN,
  metrics JSONB,
  error TEXT,
  environment JSONB,
  duration_sec REAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_deployment_runs_policy_id ON public.deployment_runs(policy_id);
CREATE INDEX idx_deployment_runs_status ON public.deployment_runs(status);
CREATE INDEX idx_deployment_runs_source ON public.deployment_runs(source);

-- ===== Categorized Failures Table =====
CREATE TABLE IF NOT EXISTS public.categorized_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES public.deployment_runs(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categorized_failures_run_id ON public.categorized_failures(run_id);
CREATE INDEX idx_categorized_failures_category ON public.categorized_failures(category);

-- ===== Improvement Recommendations Table =====
CREATE TABLE IF NOT EXISTS public.improvement_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  run_id UUID REFERENCES public.deployment_runs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  changes JSONB,
  estimated_gain REAL,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'DISMISSED')),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_improvements_policy_id ON public.improvement_recommendations(policy_id);
CREATE INDEX idx_improvements_status ON public.improvement_recommendations(status);
CREATE INDEX idx_improvements_priority ON public.improvement_recommendations(priority);

-- ===== NVIDIA Jobs Table =====
CREATE TABLE IF NOT EXISTS public.nvidia_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id TEXT UNIQUE NOT NULL,
  service TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  payload JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_nvidia_jobs_job_id ON public.nvidia_jobs(job_id);
CREATE INDEX idx_nvidia_jobs_service ON public.nvidia_jobs(service);
CREATE INDEX idx_nvidia_jobs_status ON public.nvidia_jobs(status);

-- ===== Row Level Security =====
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorized_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nvidia_jobs ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_read_own ON public.users FOR SELECT USING (true);
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (true);

-- Policies: users can read all, insert/update/delete own
CREATE POLICY policies_read_all ON public.policies FOR SELECT USING (true);
CREATE POLICY policies_insert_own ON public.policies FOR INSERT WITH CHECK (true);
CREATE POLICY policies_update_own ON public.policies FOR UPDATE USING (true);
CREATE POLICY policies_delete_own ON public.policies FOR DELETE USING (true);

-- Similar policies for other tables
CREATE POLICY deployment_runs_read ON public.deployment_runs FOR SELECT USING (true);
CREATE POLICY deployment_runs_insert ON public.deployment_runs FOR INSERT WITH CHECK (true);

CREATE POLICY failures_read ON public.categorized_failures FOR SELECT USING (true);
CREATE POLICY failures_insert ON public.categorized_failures FOR INSERT WITH CHECK (true);

CREATE POLICY improvements_read ON public.improvement_recommendations FOR SELECT USING (true);
CREATE POLICY improvements_insert ON public.improvement_recommendations FOR INSERT WITH CHECK (true);

CREATE POLICY nvidia_jobs_read ON public.nvidia_jobs FOR SELECT USING (true);
CREATE POLICY nvidia_jobs_insert ON public.nvidia_jobs FOR INSERT WITH CHECK (true);

-- ===== Triggers for updated_at =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION update_updated_at();