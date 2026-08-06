-- Policy-0 PostgreSQL Initialization Script
-- Creates tables for persistent storage of policy data, telemetry, and evolution records

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Policies Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS policies (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    robot_id VARCHAR(64) NOT NULL,
    robot_name VARCHAR(255),
    robot_dof INTEGER,
    robot_type VARCHAR(64),
    control_mode VARCHAR(64),
    environment VARCHAR(64),
    observation_space JSONB,
    domain_randomization BOOLEAN DEFAULT false,
    routing_plan_type VARCHAR(64),
    routing_confidence DECIMAL(4,3),
    routing_rationale TEXT,
    status VARCHAR(32) DEFAULT 'draft',
    python_code TEXT,
    mujoco_xml TEXT,
    ros2_node_code TEXT,
    onnx_spec JSONB,
    metrics JSONB,
    telemetry JSONB,
    sim_job_id VARCHAR(64),
    sim_job_status VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policies_robot_id ON policies(robot_id);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_created_at ON policies(created_at DESC);

-- =============================================================================
-- Video Uploads Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS video_uploads (
    id VARCHAR(64) PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT,
    mime_type VARCHAR(128),
    duration_sec DECIMAL(8,2),
    resolution VARCHAR(32),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    local_path TEXT,
    vlm_analysis_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_video_uploads_uploaded_at ON video_uploads(uploaded_at DESC);

-- =============================================================================
-- VLM Analyses Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS vlm_analyses (
    id VARCHAR(64) PRIMARY KEY,
    video_upload_id VARCHAR(64) REFERENCES video_uploads(id),
    task_title VARCHAR(255),
    task_description TEXT,
    robot_type VARCHAR(64),
    robot_dof INTEGER,
    control_mode VARCHAR(64),
    observation_space JSONB,
    environment VARCHAR(64),
    keyframes JSONB,
    obstacle_constraints JSONB,
    recommended_control_mode VARCHAR(64),
    sim_to_real_tips JSONB,
    confidence DECIMAL(4,3),
    provider VARCHAR(32), -- 'cosmos' or 'gemini'
    analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vlm_analyses_video_upload ON vlm_analyses(video_upload_id);

-- =============================================================================
-- NVIDIA Video Generation Jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS nvidia_video_jobs (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64),
    status VARCHAR(32), -- 'queued', 'generating', 'complete', 'failed'
    video_url TEXT,
    thumbnail_url TEXT,
    error_message TEXT,
    resolution VARCHAR(16),
    duration_sec DECIMAL(8,2),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    nvidia_job_id VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_nvidia_video_jobs_status ON nvidia_video_jobs(status);
CREATE INDEX IF NOT EXISTS idx_nvidia_video_jobs_request_id ON nvidia_video_jobs(request_id);

-- =============================================================================
-- ONNX Export Jobs
-- =============================================================================
CREATE TABLE IF NOT EXISTS onnx_exports (
    id VARCHAR(64) PRIMARY KEY,
    policy_id VARCHAR(64) REFERENCES policies(id),
    onnx_model_url TEXT,
    onnx_model_size_bytes BIGINT,
    input_shape VARCHAR(64),
    output_shape VARCHAR(64),
    opset_version INTEGER,
    latency_ms DECIMAL(8,2),
    export_format VARCHAR(32), -- 'onnx', 'tensorrt', 'onnx-tensorrt'
    leapp_metadata JSONB,
    exported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onnx_exports_policy ON onnx_exports(policy_id);

-- =============================================================================
-- Pipeline Runs (Isaac Sim / Isaac Lab jobs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id VARCHAR(64) PRIMARY KEY,
    kind VARCHAR(64), -- 'isaac_sim_simulation', 'isaac_lab_training', etc.
    policy_id VARCHAR(64) REFERENCES policies(id),
    robot_id VARCHAR(64),
    task_title VARCHAR(255),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(32), -- 'pending', 'queued', 'running', 'completed', 'failed', 'cancelled'
    progress_pct INTEGER DEFAULT 0,
    error_message TEXT,
    parameters JSONB,
    resources JSONB,
    artifacts_url TEXT,
    logs_url TEXT,
    parent_job_id VARCHAR(64),
    pipeline_id VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_policy ON pipeline_runs(policy_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_pipeline ON pipeline_runs(pipeline_id);

-- =============================================================================
-- Isaac ROS Deployment Packages
-- =============================================================================
CREATE TABLE IF NOT EXISTS isaac_ros_packages (
    id VARCHAR(64) PRIMARY KEY,
    policy_id VARCHAR(64) REFERENCES policies(id),
    package_name VARCHAR(128),
    workspace_root TEXT,
    onnx_model_path TEXT,
    dockerfile TEXT,
    compose_file TEXT,
    launch_files JSONB,
    config_files JSONB,
    readme TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_isaac_ros_packages_policy ON isaac_ros_packages(policy_id);

-- =============================================================================
-- Approval Decisions
-- =============================================================================
CREATE TABLE IF NOT EXISTS approvals (
    id VARCHAR(64) PRIMARY KEY,
    video_gen_id VARCHAR(64),
    policy_id VARCHAR(64),
    decision VARCHAR(32), -- 'approved', 'rejected', 'revision_requested'
    feedback TEXT,
    approved_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_video_gen ON approvals(video_gen_id);
CREATE INDEX IF NOT EXISTS idx_approvals_policy ON approvals(policy_id);

-- =============================================================================
-- Deployment Runs (Real-world telemetry)
-- =============================================================================
CREATE TABLE IF NOT EXISTS deployment_runs (
    id VARCHAR(64) PRIMARY KEY,
    policy_id VARCHAR(64) REFERENCES policies(id),
    robot_model VARCHAR(64),
    task_title VARCHAR(255),
    outcome VARCHAR(16), -- 'success', 'failure', 'partial'
    success_score DECIMAL(5,2),
    duration_sec DECIMAL(8,2),
    num_attempts INTEGER DEFAULT 1,
    error_signals JSONB,
    environment_fingerprint VARCHAR(64),
    source VARCHAR(16), -- 'sim', 'real_world'
    deployed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_runs_policy ON deployment_runs(policy_id);
CREATE INDEX IF NOT EXISTS idx_deployment_runs_outcome ON deployment_runs(outcome);
CREATE INDEX IF NOT EXISTS idx_deployment_runs_deployed_at ON deployment_runs(deployed_at DESC);

-- =============================================================================
-- Categorized Failures
-- =============================================================================
CREATE TABLE IF NOT EXISTS failures (
    id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) REFERENCES deployment_runs(id),
    policy_id VARCHAR(64) REFERENCES policies(id),
    task_title VARCHAR(255),
    robot_model VARCHAR(64),
    category VARCHAR(64),
    severity VARCHAR(16),
    description TEXT,
    root_cause TEXT,
    recommended_action TEXT,
    confidence DECIMAL(4,2),
    classified_at TIMESTAMPTZ DEFAULT NOW(),
    classifier VARCHAR(16) -- 'rules' or 'llm'
);

CREATE INDEX IF NOT EXISTS idx_failures_run ON failures(run_id);
CREATE INDEX IF NOT EXISTS idx_failures_category ON failures(category);
CREATE INDEX IF NOT EXISTS idx_failures_policy ON failures(policy_id);

-- =============================================================================
-- Improvement Recommendations
-- =============================================================================
CREATE TABLE IF NOT EXISTS improvements (
    id VARCHAR(64) PRIMARY KEY,
    policy_id VARCHAR(64) REFERENCES policies(id),
    policy_title VARCHAR(255),
    failure_category VARCHAR(64),
    title VARCHAR(255),
    description TEXT,
    changes JSONB,
    estimated_gain_pct DECIMAL(5,2),
    priority VARCHAR(16), -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(16) DEFAULT 'pending', -- 'pending', 'applied', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    applied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_improvements_policy ON improvements(policy_id);
CREATE INDEX IF NOT EXISTS idx_improvements_status ON improvements(status);

-- =============================================================================
-- Policy Evolution Records
-- =============================================================================
CREATE TABLE IF NOT EXISTS evolution_versions (
    id VARCHAR(64) PRIMARY KEY,
    policy_id VARCHAR(64) REFERENCES policies(id),
    policy_title VARCHAR(255),
    version INTEGER,
    applied_improvement_ids JSONB,
    applied_improvement_titles JSONB,
    changes_applied JSONB,
    success_rate_before_pct DECIMAL(5,2),
    projected_success_rate_pct DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evolution_versions_policy ON evolution_versions(policy_id);

-- =============================================================================
-- OSMO Jobs (Orchestration)
-- =============================================================================
CREATE TABLE IF NOT EXISTS osmo_jobs (
    id VARCHAR(64) PRIMARY KEY,
    recipe VARCHAR(64),
    status VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    progress_pct INTEGER DEFAULT 0,
    resources JSONB,
    logs_url TEXT,
    artifacts_url TEXT,
    error_message TEXT,
    parameters JSONB,
    parent_job_id VARCHAR(64),
    pipeline_id VARCHAR(64),
    local_simulated BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_osmo_jobs_status ON osmo_jobs(status);
CREATE INDEX IF NOT EXISTS idx_osmo_jobs_pipeline ON osmo_jobs(pipeline_id);

-- =============================================================================
-- OSMO Pipelines
-- =============================================================================
CREATE TABLE IF NOT EXISTS osmo_pipelines (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128),
    stages JSONB,
    jobs JSONB,
    status VARCHAR(32),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_osmo_pipelines_status ON osmo_pipelines(status);

-- =============================================================================
-- Triggers for updated_at timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Default Data
-- =============================================================================
-- Insert default admin user (password should be changed in production)
-- INSERT INTO users (id, email, password_hash, role) VALUES 
-- ('usr_admin', 'admin@policy0.local', '$2b$12$...', 'admin')
-- ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO policy0;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO policy0;