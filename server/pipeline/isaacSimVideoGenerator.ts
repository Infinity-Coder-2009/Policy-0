import { NVIDIAVideoGenRequest, NVIDIAVideoGenResult } from '../../src/types';

const ISAAC_SIM_ENDPOINT = process.env.ISAAC_SIM_ENDPOINT || 'http://localhost:8211';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface RenderRequest {
  job_id: string;
  resolution: '720p' | '1080p' | '4K';
  duration_sec: number;
  camera_path: 'orbit' | 'follow_ee' | 'fixed_overhead' | 'custom';
  camera_custom_path?: Array<{ position: [number, number, number]; target: [number, number, number]; time: number }>;
  lighting: 'studio' | 'warehouse' | 'outdoor' | 'custom';
  render_quality: 'high' | 'ultra';
  output_format: 'mp4' | 'webm';
  fps?: number;
}

interface RenderJob {
  render_job_id: string;
  status: 'pending' | 'queued' | 'rendering' | 'completed' | 'failed';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

function getNVIDIAHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (NVIDIA_API_KEY) {
    headers['Authorization'] = `Bearer ${NVIDIA_API_KEY}`;
  }
  return headers;
}

const CAMERA_PATH_MAP: Record<string, 'orbit' | 'follow_ee' | 'fixed_overhead'> = {
  'Cartesian Impedance': 'follow_ee',
  'Joint Velocity': 'orbit',
  'Delta EE Pose': 'follow_ee',
  'Action Chunks': 'orbit',
};

const LIGHTING_MAP: Record<string, 'studio' | 'warehouse' | 'outdoor'> = {
  'MuJoCo': 'studio',
  'Isaac Sim': 'warehouse',
  'Drake': 'studio',
  'PyBullet': 'studio',
};

export async function generateIsaacSimRTXVideo(
  request: NVIDIAVideoGenRequest
): Promise<NVIDIAVideoGenResult> {
  // First, we need a simulation job to render from
  // In production, this would be the job ID from a completed Isaac Sim/Isaac Lab run
  const simJobId = (request as any).nvidiaJobId || `sim_${Date.now().toString(36)}`;

  const cameraPath = CAMERA_PATH_MAP[request.controlMode] || 'follow_ee';
  const lighting = LIGHTING_MAP[(request as any).environment] || 'studio';

  const renderReq: RenderRequest = {
    job_id: simJobId,
    resolution: request.resolution,
    duration_sec: request.durationSec,
    camera_path: cameraPath,
    lighting: lighting,
    render_quality: request.resolution === '4K' ? 'ultra' : 'high',
    output_format: 'mp4',
    fps: 30,
  };

  const response = await fetch(`${ISAAC_SIM_ENDPOINT}/api/v1/render`, {
    method: 'POST',
    headers: getNVIDIAHeaders(),
    body: JSON.stringify(renderReq),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Isaac Sim render submit failed: ${response.status} - ${error}`);
  }

  const renderJob: RenderJob = await response.json();

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

async function pollRenderJob(
  renderJobId: string,
  timeoutMs: number = 300000,
  pollIntervalMs: number = 5000
): Promise<{ video_url: string; thumbnail_url: string }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(`${ISAAC_SIM_ENDPOINT}/api/v1/render/${renderJobId}`, {
      headers: getNVIDIAHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get render job status: ${response.status}`);
    }

    const job = await response.json();

    if (job.status === 'completed') {
      if (!job.video_url) {
        throw new Error('Render completed but no video URL returned');
      }
      return {
        video_url: job.video_url,
        thumbnail_url: job.thumbnail_url || '',
      };
    }
    if (job.status === 'failed') {
      throw new Error(`Rendering failed: ${job.error || 'Unknown error'}`);
    }

    console.log(`RTX rendering progress: ${job.status}...`);

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Rendering timed out after ${timeoutMs}ms`);
}

// Fallback: generate placeholder video info when Isaac Sim RTX is not available
export function generateSimulatedRTXVideo(
  request: NVIDIAVideoGenRequest
): NVIDIAVideoGenResult {
  const placeholderVideos: Record<string, string> = {
    '720p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    '1080p': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    '4K': 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  };

  return {
    id: `nvid_vid_${Date.now().toString(36)}`,
    requestId: `sim_${Date.now().toString(36)}`,
    status: 'complete',
    videoUrl: placeholderVideos[request.resolution] || placeholderVideos['1080p'],
    thumbnailUrl: `https://via.placeholder.com/320x180?text=Isaac+Sim+${request.resolution}`,
    resolution: request.resolution,
    durationSec: request.durationSec,
    generatedAt: new Date().toISOString(),
    nvidiaJobId: `sim_render_${Date.now().toString(36)}`,
  };
}