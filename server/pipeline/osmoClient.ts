/**
 * OSMO Orchestration Client — Phase 8
 * ============================================================
 * Single source of truth for NVIDIA OSMO multi-node job orchestration.
 * Consolidates the duplicated `USE_OSMO` checks previously scattered
 * across `isaacSimBridge.ts`, `isaacLabBridge.ts`, and `leappExporter.ts`.
 *
 * Capabilities:
 *   - Recipe registry (4 recipes from the NVIDIA-Stack Migration Plan)
 *   - Job lifecycle: submit / status / list / cancel
 *   - Artifact listing
 *   - Log streaming (server-sent-events style)
 *   - Multi-stage pipeline composer (recipe chains with stage deps)
 *   - In-memory job cache for the unified status view
 *   - Local simulation fallback when OSMO endpoint is unreachable
 */

import { Readable } from 'stream';

// ===== Configuration =====
const OSMO_ENDPOINT = process.env.OSMO_ENDPOINT || 'https://api.nvidia.com/v1/osmo';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
export const USE_OSMO = process.env.USE_OSMO === 'true';
/** When true and OSMO unreachable, run jobs in a local simulator loop. */
const OSMO_LOCAL_SIM = process.env.OSMO_LOCAL_SIM !== 'false';

// ===== Types =====
export type RecipeName =
  | 'isaac_sim_policy_training'
  | 'isaac_lab_rl_training'
  | 'isaac_sim_render'
  | 'leapp_onnx_export';

export interface OSMORecipe {
  name: RecipeName;
  version: string;
  description: string;
  parameters: Record<string, string>;
}

export type OSMOJobStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface OSMOJob {
  id: string;
  recipe: RecipeName;
  status: OSMOJobStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  progress_pct: number;
  resources: { gpus: number; cpus: number; memory_gb: number };
  logs_url?: string;
  artifacts_url?: string;
  error?: string;
  /** Local-only fields (when running in sim mode) */
  local_simulated?: boolean;
  parameters?: Record<string, any>;
  parent_job_id?: string | null;
  pipeline_id?: string | null;
}

export interface OSMOArtifact {
  name: string;
  size_bytes: number;
  download_url: string;
  kind: 'checkpoint' | 'onnx' | 'video' | 'tensorrt_engine' | 'log' | 'metrics' | 'other';
}

// ===== Recipe Registry (single source of truth) =====
export const RECIPES: Record<RecipeName, OSMORecipe> = {
  isaac_sim_policy_training: {
    name: 'isaac_sim_policy_training',
    version: '1.0',
    description: 'Isaac Sim physics simulation + policy execution',
    parameters: {
      robot: 'string',
      task: 'string',
      domain_randomization: 'boolean',
      control_mode: 'string',
    },
  },
  isaac_lab_rl_training: {
    name: 'isaac_lab_rl_training',
    version: '1.0',
    description: 'Isaac Lab GPU-accelerated RL training',
    parameters: {
      task_name: 'string',
      num_envs: 'number',
      algorithm: 'string',
      max_iterations: 'number',
    },
  },
  isaac_sim_render: {
    name: 'isaac_sim_render',
    version: '1.0',
    description: 'Isaac Sim RTX cinematic rendering',
    parameters: {
      job_id: 'string',
      resolution: 'string',
      duration: 'number',
      camera_path: 'string',
    },
  },
  leapp_onnx_export: {
    name: 'leapp_onnx_export',
    version: '1.0',
    description: 'LEAPP ONNX export from Isaac Lab checkpoint',
    parameters: {
      checkpoint_path: 'string',
      task_name: 'string',
      export_format: 'string',
    },
  },
};

export function getRecipe(name: RecipeName): OSMORecipe | null {
  return RECIPES[name] || null;
}

export function listRecipes(): OSMORecipe[] {
  return Object.values(RECIPES);
}

// ===== In-memory Job Cache =====
/** Local cache so /api/osmo/jobs can list recent jobs without hitting upstream. */
const jobCache = new Map<string, OSMOJob>();

function cacheJob(job: OSMOJob): void {
  jobCache.set(job.id, job);
}

export function getCachedJob(jobId: string): OSMOJob | null {
  return jobCache.get(jobId) || null;
}

export function listCachedJobs(filter?: { recipe?: RecipeName; status?: OSMOJobStatus }): OSMOJob[] {
  const jobs = Array.from(jobCache.values());
  return jobs.filter((j) => {
    if (filter?.recipe && j.recipe !== filter.recipe) return false;
    if (filter?.status && j.status !== filter.status) return false;
    return true;
  });
}

// ===== HTTP Helper =====
function getOSMOHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (NVIDIA_API_KEY) {
    headers['Authorization'] = `Bearer ${NVIDIA_API_KEY}`;
  }
  return headers;
}

function checkOSMOConfigured(): void {
  if (!USE_OSMO) {
    throw new Error('OSMO orchestration is disabled. Set USE_OSMO=true to enable.');
  }
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is required for OSMO orchestration.');
  }
}

// ===== Job ID Generator =====
let jobCounter = 0;
function makeJobId(prefix: string): string {
  jobCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${jobCounter.toString(36)}`;
}

// ===== Submit =====
/**
 * Submit an OSMO job for a known recipe.
 * When `USE_OSMO=true` and OSMO is reachable, POSTs to `${OSMO_ENDPOINT}/jobs`.
 * When OSMO is unreachable (or `OSMO_LOCAL_SIM=true`), runs locally in the
 * job cache with simulated progress — keeps the unified `/api/osmo/*` view
 * functional even without a real OSMO cluster.
 */
export async function submitOSMOJob(
  recipeName: RecipeName,
  parameters: Record<string, any>,
  options: { pipelineId?: string; parentJobId?: string } = {}
): Promise<string> {
  const recipe = RECIPES[recipeName];
  if (!recipe) {
    throw new Error(`Unknown OSMO recipe: ${recipeName}`);
  }

  if (!USE_OSMO) {
    throw new Error('OSMO orchestration is disabled. Set USE_OSMO=true to enable.');
  }

  // Try real OSMO first
  if (NVIDIA_API_KEY) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT}/jobs`, {
        method: 'POST',
        headers: getOSMOHeaders(),
        body: JSON.stringify({ recipe: recipeName, parameters }),
      });
      if (response.ok) {
        const job: Partial<OSMOJob> = await response.json();
        const fullJob: OSMOJob = {
          id: job.id || makeJobId('osmo'),
          recipe: recipeName,
          status: job.status || 'pending',
          created_at: job.created_at || new Date().toISOString(),
          progress_pct: job.progress_pct || 0,
          resources: job.resources || { gpus: 1, cpus: 8, memory_gb: 32 },
          logs_url: job.logs_url,
          artifacts_url: job.artifacts_url,
          parameters,
          pipeline_id: options.pipelineId || null,
          parent_job_id: options.parentJobId || null,
        };
        cacheJob(fullJob);
        console.log(`OSMO: Submitted ${recipeName} job ${fullJob.id} (upstream)`);
        return fullJob.id;
      }
      // Non-2xx: fall through to local sim if enabled
      console.warn(`OSMO upstream returned ${response.status}; falling back to local sim`);
    } catch (err: any) {
      console.warn(`OSMO submit failed (${err?.message || err}); falling back to local sim`);
    }
  }

  // Local simulation fallback
  if (!OSMO_LOCAL_SIM) {
    throw new Error('OSMO upstream unreachable and OSMO_LOCAL_SIM=false');
  }

  const localJob: OSMOJob = {
    id: makeJobId(`osmo_${recipeName}`),
    recipe: recipeName,
    status: 'pending',
    created_at: new Date().toISOString(),
    progress_pct: 0,
    resources: { gpus: 1, cpus: 8, memory_gb: 32 },
    parameters,
    pipeline_id: options.pipelineId || null,
    parent_job_id: options.parentJobId || null,
    local_simulated: true,
  };
  cacheJob(localJob);
  console.log(`OSMO: Submitted ${recipeName} job ${localJob.id} (local sim)`);
  // Kick off simulated progress
  scheduleSimulatedProgress(localJob.id);
  return localJob.id;
}

// ===== Local simulated progress =====
const SIM_TICK_MS = 2000;
const SIM_TOTAL_TICKS = 25; // ~50s to "complete"

function scheduleSimulatedProgress(jobId: string): void {
  let tick = 0;
  const interval = setInterval(() => {
    const job = jobCache.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      clearInterval(interval);
      return;
    }
    tick += 1;
    if (tick === 1) {
      job.status = 'running';
      job.started_at = new Date().toISOString();
    }
    job.progress_pct = Math.min(100, Math.round((tick / SIM_TOTAL_TICKS) * 100));
    if (tick >= SIM_TOTAL_TICKS) {
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      job.progress_pct = 100;
      // Add artifact URLs for downstream phases to consume
      job.artifacts_url = `${OSMO_ENDPOINT}/jobs/${jobId}/artifacts`;
      job.logs_url = `${OSMO_ENDPOINT}/jobs/${jobId}/logs`;
    }
    jobCache.set(jobId, job);
  }, SIM_TICK_MS);
}

// ===== Status =====
export async function getOSMOJobStatus(jobId: string): Promise<OSMOJob> {
  const cached = jobCache.get(jobId);
  const canQueryUpstream = USE_OSMO && NVIDIA_API_KEY && !cached?.local_simulated;

  if (canQueryUpstream) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}`, {
        headers: getOSMOHeaders(),
      });
      if (response.ok) {
        const upstream: Partial<OSMOJob> = await response.json();
        const merged: OSMOJob = {
          ...cached,
          ...upstream,
          id: jobId,
          recipe: upstream.recipe || cached?.recipe || ('isaac_sim_policy_training' as RecipeName),
          status: upstream.status || cached?.status || 'unknown',
          created_at: upstream.created_at || cached?.created_at || new Date().toISOString(),
          progress_pct: upstream.progress_pct ?? cached?.progress_pct ?? 0,
          resources: upstream.resources || cached?.resources || { gpus: 0, cpus: 0, memory_gb: 0 },
        } as OSMOJob;
        cacheJob(merged);
        return merged;
      }
    } catch (err: any) {
      console.warn(`OSMO status fetch failed for ${jobId}: ${err?.message || err}`);
    }
  }

  if (cached) return cached;
  throw new Error(`OSMO job not found: ${jobId}`);
}

export async function listOSMOJobs(filter?: {
  recipe?: RecipeName;
  status?: OSMOJobStatus;
}): Promise<OSMOJob[]> {
  // Always return cache first (fast, local, no auth needed)
  const cached = listCachedJobs(filter);

  // Try to enrich with upstream list (best-effort)
  if (USE_OSMO && NVIDIA_API_KEY) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT}/jobs`, {
        headers: getOSMOHeaders(),
      });
      if (response.ok) {
        const upstreamJobs: OSMOJob[] = await response.json();
        for (const j of upstreamJobs) {
          if (!jobCache.has(j.id)) cacheJob(j);
        }
      }
    } catch (err: any) {
      // ignore — cached list still returned
    }
  }

  return listCachedJobs(filter);
}

// ===== Cancel =====
export async function cancelOSMOJob(jobId: string): Promise<OSMOJob> {
  const cached = jobCache.get(jobId);
  const canQueryUpstream = USE_OSMO && NVIDIA_API_KEY && !cached?.local_simulated;

  if (canQueryUpstream) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: getOSMOHeaders(),
      });
      if (response.ok) {
        const upstream: Partial<OSMOJob> = await response.json();
        const merged = { ...cached, ...upstream, status: 'cancelled' as OSMOJobStatus };
        cacheJob(merged as OSMOJob);
        return merged as OSMOJob;
      }
    } catch (err: any) {
      console.warn(`OSMO cancel failed for ${jobId}: ${err?.message || err}`);
    }
  }

  if (cached) {
    cached.status = 'cancelled';
    cached.completed_at = cached.completed_at || new Date().toISOString();
    jobCache.set(jobId, cached);
    return cached;
  }

  throw new Error(`OSMO job not found: ${jobId}`);
}

// ===== Artifacts =====
export async function getOSMOJobArtifacts(jobId: string): Promise<OSMOArtifact[]> {
  const cached = jobCache.get(jobId);
  const canQueryUpstream = USE_OSMO && NVIDIA_API_KEY && !cached?.local_simulated;

  if (canQueryUpstream) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}/artifacts`, {
        headers: getOSMOHeaders(),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err: any) {
      console.warn(`OSMO artifacts fetch failed for ${jobId}: ${err?.message || err}`);
    }
  }

  // Synthesize artifacts for local sim
  if (cached) {
    if (cached.status !== 'completed') return [];
    const synthetic: OSMOArtifact[] = [];
    if (cached.recipe === 'isaac_lab_rl_training') {
      synthetic.push({
        name: `${jobId}_checkpoint.pt`,
        size_bytes: 5_000_000,
        download_url: `${OSMO_ENDPOINT}/jobs/${jobId}/artifacts/checkpoint`,
        kind: 'checkpoint',
      });
    } else if (cached.recipe === 'leapp_onnx_export') {
      synthetic.push({
        name: `${jobId}_policy.onnx`,
        size_bytes: 1_200_000,
        download_url: `${OSMO_ENDPOINT}/jobs/${jobId}/artifacts/onnx`,
        kind: 'onnx',
      });
    } else if (cached.recipe === 'isaac_sim_render') {
      synthetic.push({
        name: `${jobId}_render.mp4`,
        size_bytes: 28_000_000,
        download_url: `${OSMO_ENDPOINT}/jobs/${jobId}/artifacts/video`,
        kind: 'video',
      });
    } else if (cached.recipe === 'isaac_sim_policy_training') {
      synthetic.push({
        name: `${jobId}_metrics.json`,
        size_bytes: 4_200,
        download_url: `${OSMO_ENDPOINT}/jobs/${jobId}/artifacts/metrics`,
        kind: 'metrics',
      });
    }
    return synthetic;
  }

  throw new Error(`OSMO job not found: ${jobId}`);
}

// ===== Log streaming (Node Readable) =====
/**
 * Returns a Readable stream that emits log lines for an OSMO job.
 * For local sim jobs, emits synthetic progress lines until completion.
 * For upstream jobs, fetches `${OSMO_ENDPOINT}/jobs/:id/logs/stream` and
 * pipes the response body through line-splitter.
 *
 * The Express route subscribes to this stream and forwards via SSE/res.write.
 */
export async function streamOSMOJobLogs(jobId: string): Promise<Readable> {
  const cached = jobCache.get(jobId);

  // Local sim: emit synthetic log lines
  if (!cached || cached.local_simulated || !USE_OSMO || !NVIDIA_API_KEY) {
    const stream = new Readable({ read() {} });
    stream.push(`[osmo-local] Streaming logs for ${jobId}\n`);
    if (cached) {
      stream.push(`[osmo-local] Recipe: ${cached.recipe}, Status: ${cached.status}\n`);
      let tick = 0;
      const interval = setInterval(() => {
        tick += 1;
        const pct = Math.min(100, Math.round((tick / SIM_TOTAL_TICKS) * 100));
        stream.push(`[osmo-local] tick ${tick}/${SIM_TOTAL_TICKS} progress=${pct}%\n`);
        if (pct >= 100 || cached.status === 'cancelled') {
          stream.push(`[osmo-local] job ${jobId} completed\n`);
          stream.push(null);
          clearInterval(interval);
        }
      }, SIM_TICK_MS);
    } else {
      stream.push(`[osmo-local] Job ${jobId} not found in cache\n`);
      stream.push(null);
    }
    return stream;
  }

  // Upstream: pipe response body
  const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}/logs/stream`, {
    headers: getOSMOHeaders(),
  });
  if (!response.ok || !response.body) {
    throw new Error(`OSMO log stream failed: ${response.status}`);
  }
  // Convert Web ReadableStream to Node Readable via async iterator
  const nodeStream = new Readable({ read() {} });
  (async () => {
    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl + 1);
        buffer = buffer.slice(nl + 1);
        nodeStream.push(line);
      }
    }
    if (buffer) nodeStream.push(buffer);
    nodeStream.push(null);
  })().catch((err) => nodeStream.destroy(err));
  return nodeStream;
}

// ===== Multi-stage Pipeline Composer =====
export type PipelineStage = {
  recipe: RecipeName;
  parameters: Record<string, any>;
  /** Recipe outputs to map into the next stage's parameters */
  outputMapping?: Record<string, string>;
};

export type OSPMPipeline = {
  id: string;
  name: string;
  stages: PipelineStage[];
  jobs: Array<{ stageIndex: number; jobId: string; status: OSMOJobStatus }>;
  status: OSMOJobStatus;
  created_at: string;
  completed_at?: string;
};

const pipelines = new Map<string, OSPMPipeline>();

/**
 * Submit a multi-stage pipeline. Each stage runs after the previous stage
 * completes; outputs from completed stages are propagated into later
 * stages via simple key mappings (`outputMapping: { src_key: dst_key }`).
 *
 * Example:
 *   submitOSMOPipeline([
 *     { recipe: 'isaac_lab_rl_training', parameters: { task_name: '...', num_envs: 4096 } },
 *     { recipe: 'leapp_onnx_export', parameters: {}, outputMapping: { checkpoint_path: 'checkpoint_path' } },
 *     { recipe: 'isaac_sim_render', parameters: { resolution: '4K', duration: 10 } }
 *   ])
 *
 * The composer fires asynchronously — callers poll /api/osmo/pipeline/:id for status.
 */
export async function submitOSMOPipeline(
  name: string,
  stages: PipelineStage[]
): Promise<string> {
  if (!stages.length) throw new Error('Pipeline requires at least one stage');

  const pipelineId = `osmo_pipeline_${Date.now().toString(36)}`;
  const pipeline: OSPMPipeline = {
    id: pipelineId,
    name,
    stages,
    jobs: [],
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  pipelines.set(pipelineId, pipeline);

  // Fire stages sequentially in the background
  (async () => {
    try {
      pipeline.status = 'running';
      const stageOutputs: Record<string, Record<string, any>> = {};

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        // Apply output mapping from previous stage
        const mergedParams: Record<string, any> = { ...stage.parameters };
        if (stage.outputMapping && i > 0 && stageOutputs[i - 1]) {
          for (const [srcKey, dstKey] of Object.entries(stage.outputMapping)) {
            if (stageOutputs[i - 1][srcKey] !== undefined) {
              mergedParams[dstKey] = stageOutputs[i - 1][srcKey];
            }
          }
        }

        const jobId = await submitOSMOJob(stage.recipe, mergedParams, {
          pipelineId,
          parentJobId: i > 0 ? pipeline.jobs[i - 1].jobId : null,
        });
        pipeline.jobs.push({ stageIndex: i, jobId, status: 'pending' });
        pipelines.set(pipelineId, { ...pipeline });

        // Wait for completion (poll every 2s)
        // eslint-disable-next-line no-constant-condition
        while (true) {
          await new Promise((r) => setTimeout(r, 2000));
          const job = await getOSMOJobStatus(jobId);
          const jobEntry = pipeline.jobs.find((j) => j.jobId === jobId);
          if (jobEntry) jobEntry.status = job.status;
          pipelines.set(pipelineId, { ...pipeline });
          if (job.status === 'completed') {
            // Cache artifacts as stage outputs
            const artifacts = await getOSMOJobArtifacts(jobId);
            stageOutputs[i] = {};
            for (const a of artifacts) {
              // Expose each artifact by its kind; e.g., 'checkpoint' -> checkpoint_path
              stageOutputs[i][a.kind] = a.download_url;
            }
            break;
          }
          if (job.status === 'failed' || job.status === 'cancelled') {
            pipeline.status = job.status;
            pipeline.completed_at = new Date().toISOString();
            pipelines.set(pipelineId, { ...pipeline });
            return;
          }
        }
      }

      pipeline.status = 'completed';
      pipeline.completed_at = new Date().toISOString();
      pipelines.set(pipelineId, { ...pipeline });
    } catch (err: any) {
      pipeline.status = 'failed';
      pipeline.completed_at = new Date().toISOString();
      (pipeline as any).error = err?.message || String(err);
      pipelines.set(pipelineId, { ...pipeline });
    }
  })();

  return pipelineId;
}

export function getOSMOPipeline(pipelineId: string): OSPMPipeline | null {
  return pipelines.get(pipelineId) || null;
}

export function listOSMOPipelines(): OSPMPipeline[] {
  return Array.from(pipelines.values());
}

// ===== Convenience: Submit per-phase shortcut =====
/**
 * Convenience wrapper used by the bridges. Calling code can replace
 *   if (USE_OSMO) { fetch(...) }
 * with
 *   if (USE_OSMO) { return submitOSMOJob(recipeName, params); }
 *
 * Bridges were already calling the OSMO REST endpoint inline; this gives
 * them a single typed surface to delegate to.
 */
export async function submitViaOSMO(
  recipeName: RecipeName,
  parameters: Record<string, any>
): Promise<string> {
  return submitOSMOJob(recipeName, parameters);
}

export async function getViaOSMO(jobId: string): Promise<OSMOJob> {
  return getOSMOJobStatus(jobId);
}

// ===== Self-test helper for /api/osmo/providers status =====
export function isOSMOConfigured(): boolean {
  return USE_OSMO && !!NVIDIA_API_KEY;
}

export function getOSMOStatus() {
  return {
    enabled: USE_OSMO,
    hasApiKey: !!NVIDIA_API_KEY,
    endpoint: OSMO_ENDPOINT,
    localSim: OSMO_LOCAL_SIM,
    recipesCount: Object.keys(RECIPES).length,
    cachedJobs: jobCache.size,
    cachedPipelines: pipelines.size,
  };
}
