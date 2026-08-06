# Policy-0 Studio: NVIDIA Stack Migration Plan
## Replacing Gemini + MuJoCo with Cosmos Reasoner NIM + Isaac Sim + Isaac Lab + NIM LLMs + LEAPP + OSMO

---

## Executive Summary

This document outlines a complete migration from the current **Gemini VLM + MuJoCo + custom RL** stack to a unified **NVIDIA production-grade stack**:

| Current Component | NVIDIA Replacement |
|-------------------|-------------------|
| Gemini 3.6 Flash (video VLM) | **Cosmos Reasoner NIM** (7B reasoning VLM for physical AI) |
| Gemini 3.6 Flash (text LLM) | **NIM LLMs** (Llama 3.1 70B / 8B, Mistral, Nemotron) |
| MuJoCo physics engine | **Isaac Sim** (Omniverse-based, PhysX, RTX rendering) |
| Custom RL training | **Isaac Lab** (GPU-accelerated, 4096+ parallel envs) |
| Custom 4K video generation | **Isaac Sim RTX rendering** (photorealistic 4K) |
| Custom ONNX exporter | **LEAPP** (Lightweight Export Annotations) |
| Custom ROS2 export | **Isaac ROS** (hardware-accelerated ROS2 nodes) |
| Custom job orchestration | **OSMO** (NVIDIA's multi-node orchestrator) |

---

## Phase-by-Phase Migration Plan

### Phase 1: Cosmos Reasoner NIM — Video Understanding (Week 1-2)

**Goal:** Replace `server/pipeline/vlmAnalyzer.ts` (Gemini VLM) with Cosmos Reasoner NIM

#### Current Code (`vlmAnalyzer.ts`):
- `analyzeVideoWithVLM(videoPath, prompt)` → uploads to Gemini, returns structured task spec
- `analyzeVideoWithVLMFromDescription(description)` → text-only analysis

#### New Implementation:

```typescript
// server/pipeline/cosmosVLMAnalyzer.ts
import { VLMAnalysisResult } from '../../src/types';

const COSMOS_NIM_ENDPOINT = process.env.COSMOS_NIM_ENDPOINT || 'https://api.nvidia.com/v1/cosmos/reasoner';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface CosmosRequest {
  video_base64: string;
  text: string;
  task: 'robot_task_understanding';
}

interface CosmosResponse {
  task_title: string;
  task_description: string;
  robot_type: string;
  robot_dof: number;
  control_mode: string;
  observation_space: string[];
  environment: string;
  keyframes: Array<{
    stage: string;
    timestamp: string;
    gripper_state: string;
    action_description: string;
  }>;
  obstacle_constraints: string[];
  recommended_control_mode: string;
  sim_to_real_tips: string[];
  confidence: number;
}

export async function analyzeVideoWithCosmos(
  videoPath: string,
  prompt: string
): Promise<VLMAnalysisResult> {
  const videoBase64 = await encodeVideoToBase64(videoPath);

  const response = await fetch(COSMOS_NIM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video: videoBase64,
      text: prompt,
      task: 'robot_task_understanding',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cosmos NIM error: ${response.status} - ${error}`);
  }

  const cosmosResult: CosmosResponse = await response.json();

  return mapCosmosToVLMAnalysis(cosmosResult);
}

export async function analyzeDescriptionWithCosmos(
  description: string
): Promise<VLMAnalysisResult> {
  // Cosmos Reasoner can also handle text-only with video placeholder
  const response = await fetch(COSMOS_NIM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      video: '', // empty for text-only
      text: description,
      task: 'robot_task_understanding',
    }),
  });

  const cosmosResult: CosmosResponse = await response.json();
  return mapCosmosToVLMAnalysis(cosmosResult);
}

function mapCosmosToVLMAnalysis(cosmos: CosmosResponse): VLMAnalysisResult {
  return {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId: '',
    taskTitle: cosmos.task_title,
    taskDescription: cosmos.task_description,
    robotType: cosmos.robot_type,
    robotDof: cosmos.robot_dof,
    controlMode: cosmos.control_mode,
    observationSpace: cosmos.observation_space,
    environment: cosmos.environment,
    keyframes: cosmos.keyframes,
    obstacleConstraints: cosmos.obstacle_constraints,
    recommendedControlMode: cosmos.recommended_control_mode,
    simToRealTips: cosmos.sim_to_real_tips,
    confidence: cosmos.confidence,
    analyzedAt: new Date().toISOString(),
  };
}

async function encodeVideoToBase64(videoPath: string): Promise<string> {
  const fs = await import('fs');
  const buffer = fs.readFileSync(videoPath);
  return buffer.toString('base64');
}
```

#### Integration Points:
- Update `server.ts` imports: `vlmAnalyzer` → `cosmosVLMAnalyzer`
- Keep same API signatures (`/api/policy/analyze-vlm`, `/api/policy/analyze-description`)
- Add `COSMOS_NIM_ENDPOINT` env var (default: `https://api.nvidia.com/v1/cosmos/reasoner`)

#### Fallback Strategy:
- If Cosmos NIM unavailable → fallback to existing Gemini code (keep `vlmAnalyzer.ts` as backup)

---

### Phase 2: NIM LLM Integration — Text Understanding (Week 1-2, parallel)

**Goal:** Replace all remaining Gemini text calls with NVIDIA NIM LLMs

#### Current Gemini Text Usage:
1. `server.ts` line 356-392: Policy Python code synthesis
2. `improvementEngine.ts` line 140-200: Improvement generation via LLM

#### New Implementation:

```typescript
// server/pipeline/nimLLM.ts
import { GoogleGenAI, Type } from '@google/genai'; // Keep for Gemini fallback

const NIM_LLM_ENDPOINT = process.env.NIM_LLM_ENDPOINT || 'https://api.nvidia.com/v1/nim/llama-3-70b';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface NIMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NIMRequest {
  model: string;
  messages: NIMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

interface NIMResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

export async function callNIMLLM(
  messages: NIMMessage[],
  options: { jsonSchema?: object; temperature?: number } = {}
): Promise<string> {
  const payload: NIMRequest = {
    model: 'meta/llama-3.1-70b-instruct', // or nemotron-3-ultra
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: 4096,
    ...(options.jsonSchema && { response_format: { type: 'json_object' } }),
  };

  const response = await fetch(NIM_LLM_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`NIM LLM error: ${response.status} - ${await response.text()}`);
  }

  const data: NIMResponse = await response.json();
  return data.choices[0].message.content;
}

// Convenience for structured output (improvement generation, policy synthesis)
export async function callNIMLLMStructured<T>(
  messages: NIMMessage[],
  schema: object
): Promise<T> {
  const content = await callNIMLLM(messages, { jsonSchema: schema });
  return JSON.parse(content);
}
```

#### Migration Targets:

| File | Function | Replace With |
|------|----------|--------------|
| `server.ts` | `getGeminiClient()` + synthesis prompt | `callNIMLLMStructured()` with policy synthesis schema |
| `improvementEngine.ts` | `generateImprovementsWithLLM()` | `callNIMLLMStructured()` with improvement schema |

#### Schema Definitions (reuse existing zod/JSON schemas):

```typescript
// server/schemas/policySynthesisSchema.ts
export const policySynthesisSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    pythonCode: { type: 'string' },
    onnxInputShape: { type: 'string' },
    onnxOutputShape: { type: 'string' },
  },
  required: ['title', 'pythonCode', 'onnxInputShape', 'onnxOutputShape'],
};

// server/schemas/improvementSchema.ts
export const improvementSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      policyId: { type: 'string' },
      policyTitle: { type: 'string' },
      failureCategory: { type: 'string' },
      title: { type: 'string' },
      description: { type: 'string' },
      estimatedGainPct: { type: 'number' },
      priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
      changes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            target: { type: 'string' },
            parameter: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
          },
          required: ['target', 'parameter', 'from', 'to'],
        },
      },
    },
    required: ['policyId', 'policyTitle', 'failureCategory', 'title', 'description', 'estimatedGainPct', 'priority', 'changes'],
  },
};
```

---

### Phase 3: Isaac Sim Integration — Physics Simulation (Week 2-3)

**Goal:** Replace `server/pipeline/mujocoCompiler.ts`, `telemetryEngine.ts`, `routingEngine.ts` with Isaac Sim

#### Architecture Change:

```
OLD: Express server → MuJoCo XML compilation → Python simulation → telemetry
NEW: Express server → Isaac Sim REST API / OSMO job → Isaac Sim headless → telemetry
```

#### New Service: `server/pipeline/isaacSimBridge.ts`

```typescript
// server/pipeline/isaacSimBridge.ts
import { GeneratedPolicy, TelemetryPoint, PipelineMetrics } from '../../src/types';

const ISAAC_SIM_ENDPOINT = process.env.ISAAC_SIM_ENDPOINT || 'http://localhost:8211'; // Isaac Sim REST API
const OSMO_ENDPOINT = process.env.OSMO_ENDPOINT || 'https://api.nvidia.com/v1/osmo';

interface IsaacSimScene {
  robot: string;           // e.g., "franka_panda", "unitree_h1", "ur5e"
  task: string;            // task description
  environment: string;     // "warehouse", "factory", "lab", "custom"
  domain_randomization: boolean;
}

interface IsaacSimJob {
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scene_usd?: string;
  telemetry?: TelemetryPoint[];
  metrics?: PipelineMetrics;
  video_url?: string;
  error?: string;
}

export async function submitIsaacSimJob(scene: IsaacSimScene): Promise<string> {
  // Option A: Direct Isaac Sim REST API (local/on-prem)
  // Option B: OSMO for cloud orchestration (recommended for production)
  if (process.env.USE_OSMO === 'true') {
    return submitOSMOJob(scene);
  }
  return submitDirectIsaacSimJob(scene);
}

async function submitDirectIsaacSimJob(scene: IsaacSimScene): Promise<string> {
  const response = await fetch(`${ISAAC_SIM_ENDPOINT}/api/v1/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scene),
  });

  const job: IsaacSimJob = await response.json();
  return job.job_id;
}

async function submitOSMOJob(scene: IsaacSimScene): Promise<string> {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipe: 'isaac_sim_policy_training',
      parameters: scene,
    }),
  });

  const job = await response.json();
  return job.id;
}

export async function getIsaacSimJobStatus(jobId: string): Promise<IsaacSimJob> {
  const endpoint = process.env.USE_OSMO === 'true'
    ? `${OSMO_ENDPOINT}/jobs/${jobId}`
    : `${ISAAC_SIM_ENDPOINT}/api/v1/jobs/${jobId}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.USE_OSMO === 'true') {
    headers['Authorization'] = `Bearer ${process.env.NVIDIA_API_KEY}`;
  }

  const response = await fetch(endpoint, { headers });
  return response.json();
}

export async function generateIsaacSimVideo(
  jobId: string,
  options: { resolution: '1080p' | '4K'; duration: number; camera_path?: string }
): Promise<{ video_url: string; thumbnail_url: string }> {
  const response = await fetch(`${ISAAC_SIM_ENDPOINT}/api/v1/jobs/${jobId}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  return response.json();
}
```

#### Robot Asset Mapping (MuJoCo → Isaac Sim USD):

| Current Robot | MuJoCo Model | Isaac Sim USD Asset |
|---------------|--------------|---------------------|
| Franka Panda | `franka_panda.xml` | `Isaac/Robots/Franka/franka.usd` |
| UR5e | `ur5e.xml` | `Isaac/Robots/UniversalRobots/ur5e/ur5e.usd` |
| Unitree H1 | `unitree_h1.xml` | `Isaac/Robots/Unitree/H1/h1.usd` |
| Kinova Gen3 | `kinova_gen3.xml` | `Isaac/Robots/Kinova/gen3/gen3.usd` |
| Shadow Hand | `shadow_hand.xml` | `Isaac/Robots/ShadowHand/shadow_hand.usd` |
| TurtleBot 4 | `turtlebot4.xml` | `Isaac/Robots/TurtleBot4/turtlebot4.usd` |

#### Environment Mapping:

| Current | Isaac Sim Environment |
|---------|----------------------|
| `MuJoCo` | `Isaac/Environments/Simple_Room/simple_room.usd` |
| `Isaac Sim` | `Isaac/Environments/Warehouse/warehouse.usd` |
| Custom | User-provided USD |

---

### Phase 4: Isaac Lab Integration — Policy Training (Week 3-4)

**Goal:** Replace custom RL training (`server/pipeline/telemetryEngine.ts` simulation + custom policy synthesis) with Isaac Lab GPU-accelerated training

#### Isaac Lab Training Flow:

```
1. Define task config (YAML) → maps to your TaskInput
2. Isaac Lab creates 4096 parallel environments on GPU
3. Train with RSL-RL / SKRL / Stable-Baselines3 (PPO, SAC)
4. Domain randomization built-in
5. Export checkpoint → ONNX via LEAPP
```

#### New Service: `server/pipeline/isaacLabBridge.ts`

```typescript
// server/pipeline/isaacLabBridge.ts
import { GeneratedPolicy, TaskInput } from '../../src/types';

const ISAAC_LAB_ENDPOINT = process.env.ISAAC_LAB_ENDPOINT || 'http://localhost:8212'; // Isaac Lab API
const OSMO_ENDPOINT = process.env.OSMO_ENDPOINT || 'https://api.nvidia.com/v1/osmo';

interface IsaacLabTaskConfig {
  task_name: string;           // e.g., "Isaac-Velocity-Flat-Unitree-H1-v0"
  robot: string;
  num_envs: number;            // 4096 for single A100/H100
  max_iterations: number;      // e.g., 5000
  algorithm: 'PPO' | 'SAC' | 'IL';
  domain_randomization: boolean;
  headless: boolean;
  checkpoint_path?: string;    // for resume
}

interface IsaacLabTrainingJob {
  job_id: string;
  status: 'pending' | 'training' | 'completed' | 'failed';
  progress_pct: number;
  current_iteration: number;
  metrics: {
    mean_reward: number;
    success_rate: number;
    episode_length: number;
  };
  checkpoint_url?: string;
  onnx_export_url?: string;
  video_url?: string;
  error?: string;
}

// Map Policy-0 TaskInput → Isaac Lab task
function mapTaskToIsaacLab(task: TaskInput): IsaacLabTaskConfig {
  const robotTaskMap: Record<string, string> = {
    'franka_panda': 'Isaac-Manipulation-Franka-Panda-v0',
    'ur5e': 'Isaac-Manipulation-UR5e-v0',
    'unitree_h1': 'Isaac-Locomotion-H1-v0',
    'kinova_gen3': 'Isaac-Manipulation-Kinova-Gen3-v0',
    'shadow_hand': 'Isaac-Dexterous-ShadowHand-v0',
    'turtlebot4': 'Isaac-Navigation-TurtleBot4-v0',
  };

  const algoMap: Record<string, 'PPO' | 'SAC' | 'IL'> = {
    'Cartesian Impedance': 'IL',      // Imitation learning for precise manipulation
    'Joint Velocity': 'PPO',
    'Delta EE Pose': 'PPO',
    'Action Chunks': 'PPO',
  };

  return {
    task_name: robotTaskMap[task.robotId] || 'Isaac-Manipulation-Franka-Panda-v0',
    robot: task.robotId,
    num_envs: task.domainRandomization ? 4096 : 1024,
    max_iterations: 5000,
    algorithm: algoMap[task.controlMode] || 'PPO',
    domain_randomization: task.domainRandomization,
    headless: true,
  };
}

export async function submitIsaacLabTraining(task: TaskInput): Promise<string> {
  const config = mapTaskToIsaacLab(task);

  if (process.env.USE_OSMO === 'true') {
    return submitOSMOTrainingJob(config);
  }

  const response = await fetch(`${ISAAC_LAB_ENDPOINT}/api/v1/training`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  const job: IsaacLabTrainingJob = await response.json();
  return job.job_id;
}

async function submitOSMOTrainingJob(config: IsaacLabTaskConfig): Promise<string> {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipe: 'isaac_lab_rl_training',
      parameters: config,
    }),
  });

  const job = await response.json();
  return job.id;
}

export async function getIsaacLabJobStatus(jobId: string): Promise<IsaacLabTrainingJob> {
  const endpoint = process.env.USE_OSMO === 'true'
    ? `${OSMO_ENDPOINT}/jobs/${jobId}`
    : `${ISAAC_LAB_ENDPOINT}/api/v1/training/${jobId}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.USE_OSMO === 'true') {
    headers['Authorization'] = `Bearer ${process.env.NVIDIA_API_KEY}`;
  }

  const response = await fetch(endpoint, { headers });
  return response.json();
}

export async function exportIsaacLabPolicyToONNX(
  jobId: string,
  checkpointPath: string
): Promise<{ onnx_url: string; metadata: any }> {
  // Use LEAPP (Lightweight Export Annotations) for ONNX export
  const response = await fetch(`${ISAAC_LAB_ENDPOINT}/api/v1/export/onnx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_id: jobId,
      checkpoint: checkpointPath,
      format: 'onnx',
      optimize: true,
    }),
  });

  return response.json();
}
```

#### Task Type → Isaac Lab Algorithm Mapping:

| Policy-0 Plan Type | Isaac Lab Algorithm | Rationale |
|-------------------|---------------------|-----------|
| Plan A: Symbolic Trajectory | **Imitation Learning (IL)** | Precise manipulation from demonstrations |
| Plan B: Neural VLA (ONNX) | **PPO + VLA architecture** | Vision-language-action policy |
| Plan C: RL (PPO) | **PPO** | Standard RL for locomotion |

---

### Phase 5: 4K Video Generation via Isaac Sim RTX (Week 4-5)

**Goal:** Replace `server/pipeline/nvidiaVideoGenerator.ts` (simulated) with real Isaac Sim RTX rendering

#### Current: Simulated video generator with fallback
#### New: Real Isaac Sim cinematic rendering

```typescript
// server/pipeline/isaacSimVideoGenerator.ts
import { NVIDIAVideoGenRequest, NVIDIAVideoGenResult } from '../../src/types';

const ISAAC_SIM_ENDPOINT = process.env.ISAAC_SIM_ENDPOINT || 'http://localhost:8211';

interface RenderRequest {
  job_id: string;
  resolution: '1080p' | '4K';
  duration_sec: number;
  camera_path: 'orbit' | 'follow_ee' | 'fixed_overhead' | 'custom';
  camera_custom_path?: Array<{ position: [number, number, number]; target: [number, number, number]; time: number }>;
  lighting: 'studio' | 'warehouse' | 'outdoor' | 'custom';
  render_quality: 'high' | 'ultra';
  output_format: 'mp4' | 'webm';
}

export async function generateIsaacSimVideo(
  request: NVIDIAVideoGenRequest
): Promise<NVIDIAVideoGenResult> {
  // First, ensure a simulation job exists for this task
  const simJobId = await ensureSimulationJob(request);

  // Submit render job
  const renderReq: RenderRequest = {
    job_id: simJobId,
    resolution: request.resolution,
    duration_sec: request.durationSec,
    camera_path: 'follow_ee', // Best for manipulation tasks
    lighting: 'studio',
    render_quality: request.resolution === '4K' ? 'ultra' : 'high',
    output_format: 'mp4',
  };

  const response = await fetch(`${ISAAC_SIM_ENDPOINT}/api/v1/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(renderReq),
  });

  const renderJob = await response.json();

  // Poll for completion
  const videoResult = await pollRenderJob(renderJob.render_job_id);

  return {
    id: `nvid_vid_${Date.now().toString(36)}`,
    requestId: simJobId,
    status: 'complete',
    videoUrl: videoResult.video_url,
    thumbnailUrl: videoResult.thumbnail_url,
    resolution: request.resolution,
    durationSec: request.durationSec,
    generatedAt: new Date().toISOString(),
    nvidiaJobId: renderJob.render_job_id,
  };
}

async function ensureSimulationJob(request: NVIDIAVideoGenRequest): Promise<string> {
  // Check if we have a recent sim job for this task/robot
  // If not, submit a quick simulation job first
  // This is where Isaac Sim does the physics + policy execution
  // For video generation, we need the policy to run in sim
  return 'sim_job_' + Date.now().toString(36); // Placeholder
}

async function pollRenderJob(renderJobId: string): Promise<{ video_url: string; thumbnail_url: string }> {
  // Poll /api/v1/render/{id} until status === 'completed'
  // Return video_url and thumbnail_url
  return { video_url: '', thumbnail_url: '' };
}
```

#### Camera Paths for Different Tasks:

| Task Type | Camera Path | Description |
|-----------|-------------|-------------|
| Manipulation (peg insert) | `follow_ee` | Follows end-effector |
| Humanoid walking | `orbit` | Orbits around robot |
| Mobile manipulation | `fixed_overhead` | Top-down warehouse view |
| Dexterous hand | `close_up_hand` | Close-up on fingers |

---

### Phase 6: ONNX Export via LEAPP (Week 5-6)

**Goal:** Replace `server/pipeline/onnxExporter.ts` (custom JSON-based ONNX) with Isaac Lab LEAPP export

#### LEAPP Export Flow:

```
Isaac Lab Checkpoint (.pt/.pth)
    → LEAPP Exporter (isaaclab/scripts/reinforcement_learning/leapp/rsl_rl/export.py)
    → ONNX model + metadata (input/output semantics, normalization params)
    → Optional: TensorRT conversion for deployment
```

#### New Service: `server/pipeline/leappExporter.ts`

```typescript
// server/pipeline/leappExporter.ts
import { OnnxExportResult, GeneratedPolicy, OnnxExportOptions } from '../../src/types';

const ISAAC_LAB_ENDPOINT = process.env.ISAAC_LAB_ENDPOINT || 'http://localhost:8212';

interface LEAPPExportRequest {
  checkpoint_path: string;     // Path to .pt checkpoint from Isaac Lab training
  task_name: string;           // e.g., "Isaac-Manipulation-Franka-Panda-v0"
  export_format: 'onnx' | 'tensorrt' | 'onnx-tensorrt';
  optimize: boolean;
  quantization?: 'fp32' | 'fp16' | 'int8';
  input_normalization?: boolean;
}

interface LEAPPExportResponse {
  onnx_path: string;
  onnx_size_bytes: number;
  input_shape: string;
  output_shape: string;
  opset_version: number;
  latency_ms: number;
  metadata: {
    observation_keys: string[];
    action_keys: string[];
    normalization: { mean: number[]; std: number[] };
  };
}

export async function exportPolicyViaLEAPP(
  options: OnnxExportOptions
): Promise<OnnxExportResult> {
  const { policy, format, optimize, quantization } = options;

  // Need the Isaac Lab checkpoint from training job
  const checkpointPath = await getCheckpointForPolicy(policy.id);
  if (!checkpointPath) {
    throw new Error('No Isaac Lab checkpoint found for policy. Train with Isaac Lab first.');
  }

  const taskName = mapPolicyToIsaacLabTask(policy);

  const response = await fetch(`${ISAAC_LAB_ENDPOINT}/api/v1/export/onnx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkpoint_path: checkpointPath,
      task_name: taskName,
      export_format: format,
      optimize,
      quantization,
    }),
  });

  const result: LEAPPExportResponse = await response.json();

  return {
    id: `onnx_${Date.now().toString(36)}`,
    policyId: policy.id,
    onnxModelUrl: `/exports/onnx/${result.onnx_path.split('/').pop()}`,
    onnxModelSizeBytes: result.onnx_size_bytes,
    inputShape: result.input_shape,
    outputShape: result.output_shape,
    opsetVersion: result.opset_version,
    latencyMs: result.latency_ms,
    exportedAt: new Date().toISOString(),
    exportFormat: format,
  };
}

function mapPolicyToIsaacLabTask(policy: GeneratedPolicy): string {
  const map: Record<string, string> = {
    'franka_panda': 'Isaac-Manipulation-Franka-Panda-v0',
    'ur5e': 'Isaac-Manipulation-UR5e-v0',
    'unitree_h1': 'Isaac-Locomotion-H1-v0',
    'kinova_gen3': 'Isaac-Manipulation-Kinova-Gen3-v0',
    'shadow_hand': 'Isaac-Dexterous-ShadowHand-v0',
    'turtlebot4': 'Isaac-Navigation-TurtleBot4-v0',
  };
  return map[policy.robot.id] || 'Isaac-Manipulation-Franka-Panda-v0';
}

async function getCheckpointForPolicy(policyId: string): Promise<string | null> {
  // Look up checkpoint path from training job metadata
  // Stored in data store or OSMO job metadata
  return null; // Placeholder
}
```

#### LEAPP Output Metadata (Critical for Deployment):

```json
{
  "observation_keys": ["joint_pos", "joint_vel", "ee_pos", "ee_quat", "force_torque"],
  "action_keys": ["joint_target_pos"],
  "normalization": {
    "mean": [0.0, 0.0, ...],
    "std": [1.0, 1.0, ...]
  }
}
```

This metadata must be bundled with ONNX for correct deployment normalization.

---

### Phase 7: ROS2 / Isaac ROS Deployment (Week 6-7)

**Goal:** Replace `server/pipeline/ros2Exporter.ts` (custom template) with Isaac ROS hardware-accelerated nodes

#### Isaac ROS Advantages:
- **Isaac ROS GEMs**: Pre-built, GPU-accelerated ROS2 packages
- **NITROS**: Zero-copy data flow between ROS2 and CUDA
- **DNN Inference**: TensorRT-optimized ONNX inference nodes

#### Key Isaac ROS GEMs to Use:

| GEM | Purpose |
|-----|---------|
| `isaac_ros_dnn_inference` | ONNX/TensorRT model inference in ROS2 |
| `isaac_ros_tensor_rt` | TensorRT engine building/optimization |
| `isaac_ros_nitros` | Zero-copy GPU data sharing |
| `isaac_ros_visual_slam` | Visual SLAM for mobile robots |
| `isaac_ros_depth` | Depth estimation from stereo/RGB-D |

#### New Deployment Service: `server/pipeline/isaacROSExporter.ts`

```typescript
// server/pipeline/isaacROSExporter.ts
import { GeneratedPolicy, OnnxExportResult } from '../../src/types';

export interface IsaacROSDeploymentPackage {
  ros2_workspace: string;        // Path to generated ROS2 workspace
  dockerfile: string;            // Dockerfile for containerized deployment
  compose_file: string;          // docker-compose.yml
  launch_files: string[];        // Launch file paths
  config_files: string[];        // YAML configs (DNN inference params)
  onnx_model_path: string;       // Copied ONNX model
  tensorrt_engine_path?: string; // Optional pre-built TensorRT engine
  readme: string;                // Deployment instructions
}

export async function generateIsaacROSDeployment(
  policy: GeneratedPolicy,
  onnxExport: OnnxExportResult
): Promise<IsaacROSDeploymentPackage> {
  // 1. Generate ROS2 package structure with Isaac ROS DNN inference node
  // 2. Create launch file that loads ONNX + normalization metadata
  // 3. Generate Dockerfile with Isaac ROS base image
  // 4. Output deployable package

  const packageName = `policy0_${policy.robot.id}_${policy.id}`;

  const launchFile = generateLaunchFile(packageName, onnxExport);
  const dnnConfig = generateDNNConfig(onnxExport);
  const dockerfile = generateDockerfile();
  const composeFile = generateComposeFile(packageName);
  const readme = generateREADME(packageName, policy);

  return {
    ros2_workspace: `/deploy/${packageName}`,
    dockerfile,
    compose_file: composeFile,
    launch_files: [launchFile],
    config_files: [dnnConfig],
    onnx_model_path: onnxExport.onnxModelUrl,
    readme,
  };
}

function generateLaunchFile(packageName: string, onnxExport: OnnxExportResult): string {
  return `<?xml version="1.0"?>
<launch>
  <arg name="model_path" default="${onnxExport.onnxModelUrl}"/>
  <arg name="input_tensor_names" default="observation"/>
  <arg name="output_tensor_names" default="action"/>

  <node pkg="isaac_ros_dnn_inference" exec="dnn_inference_node" name="policy_inference">
    <param name="model_file_path" value="\$(var model_path)"/>
    <param name="input_tensor_names" value="\$(var input_tensor_names)"/>
    <param name="output_tensor_names" value="\$(var output_tensor_names)"/>
    <param name="enable_tensorrt" value="true"/>
    <param name="tensorrt_precision" value="fp16"/>
    <remap from="input_tensor" to="/policy/observation"/>
    <remap from="output_tensor" to="/policy/action"/>
  </node>

  <!-- Your robot-specific interface nodes here -->
  <node pkg="${packageName}" exec="robot_interface_node" name="robot_interface"/>
</launch>`;
}

function generateDNNConfig(onnxExport: OnnxExportResult): string {
  return `dnn_inference:
  ros__parameters:
    model_file_path: "${onnxExport.onnxModelUrl}"
    input_tensor_names: ["observation"]
    output_tensor_names: ["action"]
    enable_tensorrt: true
    tensorrt_precision: "fp16"
    input_binding_names: ["observation"]
    output_binding_names: ["action"]
    force_engine_update: false
    engine_cache_path: "/tmp/trt_engines"`;
}

function generateDockerfile(): string {
  return `FROM nvcr.io/nvidia/isaac-ros:humble-2024.1

# Install policy-specific dependencies
RUN apt-get update && apt-get install -y \\
    python3-pip \\
    && rm -rf /var/lib/apt/lists/*

# Copy ONNX model and configs
COPY policy.onnx /models/policy.onnx
COPY dnn_inference.yaml /config/dnn_inference.yaml
COPY launch /launch

# Build ROS2 workspace
WORKDIR /workspace
COPY src/ src/
RUN . /opt/ros/humble/setup.sh && colcon build --symlink-install

ENTRYPOINT ["/ros_entrypoint.sh"]
CMD ["ros2", "launch", "policy_deploy.launch.xml"]`;
}

function generateComposeFile(packageName: string): string {
  return `version: '3.8'
services:
  policy-inference:
    build: .
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - ROS_DOMAIN_ID=0
    volumes:
      - ./models:/models:ro
      - ./config:/config:ro
    network_mode: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]`;
}

function generateREADME(packageName: string, policy: GeneratedPolicy): string {
  return `# ${packageName} Deployment Package

## Policy Details
- **Title**: ${policy.title}
- **Robot**: ${policy.robot.name} (${policy.robot.dof}-DoF)
- **Control Mode**: ${policy.input.controlMode}
- **Observation Space**: ${policy.input.observationSpace.join(', ')}

## Quick Start
\`\`\`bash
docker compose up --build
\`\`\`

## ROS2 Topics
- **Input**: \`/policy/observation\` (sensor_msgs/msg/JointState + geometry_msgs/msg/Pose + sensor_msgs/msg/Wrench)
- **Output**: \`/policy/action\` (sensor_msgs/msg/JointState)

## Normalization
The ONNX model expects normalized inputs. See \`dnn_inference.yaml\` for mean/std values.
`;
}
```

---

### Phase 8: OSMO Orchestration (Week 7-8)

**Goal:** Replace ad-hoc job management with NVIDIA OSMO for production-grade orchestration

#### OSMO Capabilities:
- Multi-node job scheduling (training, simulation, rendering)
- Resource allocation (GPU, CPU, memory)
- Job dependencies and pipelines
- Monitoring, logging, artifact management
- Cloud (DGX Cloud) + on-prem hybrid

#### Integration: `server/pipeline/osmoClient.ts`

```typescript
// server/pipeline/osmoClient.ts
const OSMO_ENDPOINT = process.env.OSMO_ENDPOINT || 'https://api.nvidia.com/v1/osmo';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface OSMORecipe {
  name: string;
  version: string;
  description: string;
  parameters: Record<string, any>;
}

interface OSMOJob {
  id: string;
  recipe: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  resources: { gpus: number; cpus: number; memory_gb: number };
  logs_url: string;
  artifacts_url: string;
}

const RECIPES: Record<string, OSMORecipe> = {
  isaac_sim_policy_training: {
    name: 'isaac_sim_policy_training',
    version: '1.0',
    description: 'Isaac Sim physics simulation + policy execution',
    parameters: { robot: 'string', task: 'string', domain_randomization: 'boolean' },
  },
  isaac_lab_rl_training: {
    name: 'isaac_lab_rl_training',
    version: '1.0',
    description: 'Isaac Lab GPU-accelerated RL training',
    parameters: { task_name: 'string', num_envs: 'number', algorithm: 'string' },
  },
  isaac_sim_render: {
    name: 'isaac_sim_render',
    version: '1.0',
    description: 'Isaac Sim RTX cinematic rendering',
    parameters: { job_id: 'string', resolution: 'string', duration: 'number' },
  },
  leapp_onnx_export: {
    name: 'leapp_onnx_export',
    version: '1.0',
    description: 'LEAPP ONNX export from Isaac Lab checkpoint',
    parameters: { checkpoint_path: 'string', task_name: 'string' },
  },
};

export async function submitOSMOJob(
  recipeName: keyof typeof RECIPES,
  parameters: Record<string, any>
): Promise<string> {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipe: recipeName,
      parameters,
    }),
  });

  const job: OSMOJob = await response.json();
  return job.id;
}

export async function getOSMOJobStatus(jobId: string): Promise<OSMOJob> {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}`, {
    headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
  });
  return response.json();
}

export async function getOSMOJobArtifacts(jobId: string): Promise<string[]> {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}/artifacts`, {
    headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
  });
  return response.json();
}

export async function streamOSMOJobLogs(jobId: string, onLog: (line: string) => void): Promise<void> {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs/${jobId}/logs/stream`, {
    headers: { 'Authorization': `Bearer ${NVIDIA_API_KEY}` },
  });

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    chunk.split('\n').forEach(line => line && onLog(line));
  }
}
```

---

## Environment Variables Summary

```bash
# NVIDIA API
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_API_BASE=https://api.nvidia.com

# Cosmos Reasoner NIM
COSMOS_NIM_ENDPOINT=https://api.nvidia.com/v1/cosmos/reasoner

# NIM LLMs
NIM_LLM_ENDPOINT=https://api.nvidia.com/v1/nim/llama-3-70b

# Isaac Sim (local or cloud)
ISAAC_SIM_ENDPOINT=http://localhost:8211
# Or DGX Cloud: https://isaac-sim.your-cluster.nvidia.com

# Isaac Lab (local or cloud)
ISAAC_LAB_ENDPOINT=http://localhost:8212

# OSMO Orchestration
OSMO_ENDPOINT=https://api.nvidia.com/v1/osmo
USE_OSMO=true  # Set to 'true' to use OSMO instead of direct endpoints

# Optional: Custom model overrides
NIM_MODEL_POLICY_SYNTHESIS=meta/llama-3.1-70b-instruct
NIM_MODEL_IMPROVEMENTS=meta/llama-3.1-70b-instruct
NIM_MODEL_CATEGORIZATION=nvidia/nemotron-3-ultra
```

---

## File Migration Map

| Current File | Phase | New File(s) | Status |
|--------------|-------|-------------|--------|
| `vlmAnalyzer.ts` | 1 | `cosmosVLMAnalyzer.ts` | 🔄 New |
| `server.ts` (Gemini text calls) | 2 | `nimLLM.ts` | 🔄 New |
| `improvementEngine.ts` (LLM) | 2 | uses `nimLLM.ts` | 🔄 Update |
| `mujocoCompiler.ts` | 3 | `isaacSimBridge.ts` | 🔄 Replace |
| `telemetryEngine.ts` | 3 | `isaacSimBridge.ts` / `isaacLabBridge.ts` | 🔄 Replace |
| `routingEngine.ts` | 3 | `isaacLabBridge.ts` (task mapping) | 🔄 Replace |
| `nvidiaVideoGenerator.ts` | 5 | `isaacSimVideoGenerator.ts` | 🔄 Replace |
| `onnxExporter.ts` | 6 | `leappExporter.ts` | 🔄 Replace |
| `ros2Exporter.ts` | 7 | `isaacROSExporter.ts` | 🔄 Replace |
| — | 8 | `osmoClient.ts` | 🔄 New |

---

## Backward Compatibility Strategy

1. **Keep all existing API endpoints unchanged** — same request/response contracts
2. **Feature flags** — env vars to toggle old vs new implementations:
   ```typescript
   const USE_COSMOS_VLM = process.env.USE_COSMOS_VLM === 'true';
   const USE_ISAAC_SIM = process.env.USE_ISAAC_SIM === 'true';
   const USE_ISAAC_LAB = process.env.USE_ISAAC_LAB === 'true';
   const USE_LEAPP_EXPORT = process.env.USE_LEAPP_EXPORT === 'true';
   const USE_ISAAC_ROS = process.env.USE_ISAAC_ROS === 'true';
   const USE_OSMO = process.env.USE_OSMO === 'true';
   ```
3. **Gradual rollout** — enable per-phase, test, then move to next
4. **Fallback chain** — New → Old → Mock (for each phase)

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1: Cosmos Reasoner NIM | 1-2 weeks | NVIDIA API access |
| 2: NIM LLM | 1 week (parallel with 1) | NVIDIA API access |
| 3: Isaac Sim Bridge | 2-3 weeks | Isaac Sim installed / DGX Cloud access |
| 4: Isaac Lab Bridge | 2-3 weeks | Isaac Lab installed |
| 5: Isaac Sim 4K Video | 1-2 weeks | Isaac Sim RTX rendering working |
| 6: LEAPP ONNX Export | 1-2 weeks | Isaac Lab training producing checkpoints |
| 7: Isaac ROS Deploy | 1-2 weeks | Isaac ROS containers available |
| 8: OSMO Orchestration | 1-2 weeks | OSMO access (DGX Cloud) |

**Total: ~8-12 weeks for full migration**

---

## Quick Start: Phase 1 Only (Cosmos Reasoner NIM)

If you want to start immediately with the highest-impact change (video understanding):

1. **Get NVIDIA API Key** → NVIDIA Developer Program
2. **Enable Cosmos Reasoner NIM** → NVIDIA NGC catalog
3. **Add `server/pipeline/cosmosVLMAnalyzer.ts`** (code above)
4. **Update `server.ts`** to import and use it
5. **Set env vars**: `NVIDIA_API_KEY`, `COSMOS_NIM_ENDPOINT`
6. **Test**: Upload video → `/api/policy/analyze-vlm` → verify structured output

This single change replaces Gemini VLM with a robotics-specialized VLM that reasons about physics, space, and time.

---

## Next Steps

Would you like me to:
1. **Start Phase 1 implementation** (Cosmos Reasoner NIM integration)?
2. **Create the complete `cosmosVLMAnalyzer.ts`** with full error handling and fallback?
3. **Set up the feature flag system** for gradual migration?
4. **Create a test script** to validate Cosmos NIM output matches current VLM format?

Let me know which phase to begin implementing.