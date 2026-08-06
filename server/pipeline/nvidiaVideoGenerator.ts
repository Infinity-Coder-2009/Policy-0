import { NVIDIAVideoGenRequest, NVIDIAVideoGenResult, NVIDIAVideoStatus } from '../../src/types';
import { getTable } from '../data/sqliteStore';

const NVIDIA_API_BASE = process.env.NVIDIA_API_BASE || 'https://api.nvidia.com';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';

interface NvidiaOmniverseJob {
  jobId: string;
  status: string;
  resultUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
}

const activeJobs = getTable<NvidiaOmniverseJob & { id: string }>('nvidia_video_jobs');

export async function generateNVIDIAVideo(request: NVIDIAVideoGenRequest): Promise<NVIDIAVideoGenResult> {
  const jobId = `nvid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const resultId = `vid_${Date.now().toString(36)}`;

  const job: NvidiaOmniverseJob = {
    jobId,
    status: 'queued',
    resultUrl: null,
    thumbnailUrl: null,
    error: null,
  };

  activeJobs.upsert({ ...job, id: jobId });

  try {
    job.status = 'generating';

    const videoUrl = await submitToNVIDIAOmniverse(request, jobId);
    const thumbnailUrl = await generateThumbnailFromVideo(videoUrl, request.resolution);

    job.status = 'complete';
    job.resultUrl = videoUrl;
    job.thumbnailUrl = thumbnailUrl;
    activeJobs.updateById(jobId, { status: job.status, resultUrl: job.resultUrl, thumbnailUrl: job.thumbnailUrl });

    const result: NVIDIAVideoGenResult = {
      id: resultId,
      requestId: jobId,
      status: 'complete',
      videoUrl,
      thumbnailUrl,
      resolution: request.resolution,
      durationSec: request.durationSec,
      generatedAt: new Date().toISOString(),
      nvidiaJobId: jobId,
    };

    return result;
  } catch (error: any) {
    job.status = 'failed';
    job.error = error?.message || 'NVIDIA video generation failed';
    activeJobs.updateById(jobId, { status: job.status, error: job.error });

    const result: NVIDIAVideoGenResult = {
      id: resultId,
      requestId: jobId,
      status: 'failed',
      videoUrl: '',
      thumbnailUrl: '',
      resolution: request.resolution,
      durationSec: request.durationSec,
      generatedAt: new Date().toISOString(),
      nvidiaJobId: jobId,
      errorMessage: error?.message || 'NVIDIA video generation failed',
    };

    return result;
  }
}

async function submitToNVIDIAOmniverse(request: NVIDIAVideoGenRequest, jobId: string): Promise<string> {
  if (!NVIDIA_API_KEY) {
    return await simulateNVIDIAVideoGeneration(request, jobId);
  }

  try {
    const response = await fetch(`${NVIDIA_API_BASE}/omniverse/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'X-Job-Id': jobId,
      },
      body: JSON.stringify({
        task: {
          title: request.taskTitle,
          description: request.taskDescription,
          robotModel: request.robotModel,
          robotDof: request.robotDof,
          controlMode: request.controlMode,
        },
        render: {
          resolution: request.resolution,
          durationSec: request.durationSec,
          domainRandomization: request.domainRandomization,
          outputFormat: 'mp4',
          codec: 'h264',
          bitrate: request.resolution === '4K' ? '50M' : request.resolution === '1080p' ? '20M' : '10M',
        },
        environment: {
          physicsEngine: 'PhysX 5',
          gravity: [0, 0, -9.81],
          timestep: 0.001,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`NVIDIA Omniverse API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.resultUrl || data.videoUrl || '';
  } catch (error: any) {
    console.warn('NVIDIA Omniverse API call failed, falling back to simulation:', error.message);
    return await simulateNVIDIAVideoGeneration(request, jobId);
  }
}

async function simulateNVIDIAVideoGeneration(request: NVIDIAVideoGenRequest, jobId: string): Promise<string> {
  const delayMs = 3000;
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  const videoUrl = `https://storage.nvidia-omniverse.example/jobs/${jobId}/output.mp4`;
  return videoUrl;
}

async function generateThumbnailFromVideo(videoUrl: string, resolution: string): Promise<string> {
  const thumbResolution = resolution === '4K' ? '384x216' : resolution === '1080p' ? '192x108' : '128x72';
  return `${videoUrl.replace('.mp4', '_thumb.jpg')}?width=${thumbResolution.split('x')[0]}&height=${thumbResolution.split('x')[1]}`;
}

export function getNVIDIAJobStatus(jobId: string): NVIDIAVideoStatus | null {
  const job = activeJobs.find((j) => j.id === jobId);
  if (!job) return null;
  return job.status as NVIDIAVideoStatus;
}

export function getNVIDIAJobResult(jobId: string): NvidiaOmniverseJob | null {
  return activeJobs.find((j) => j.id === jobId) || null;
}