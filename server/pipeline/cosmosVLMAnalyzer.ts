import { VLMAnalysisResult } from '../../src/types';

const COSMOS_NIM_ENDPOINT = process.env.COSMOS_NIM_ENDPOINT || 'https://api.nvidia.com/v1/cosmos/reasoner';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface CosmosRequest {
  video: string;        // base64 encoded video or empty for text-only
  text: string;         // prompt / description
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

function getNVIDIAHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function callCosmosNIM(payload: CosmosRequest): Promise<CosmosResponse> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not defined in environment variables. Cosmos Reasoner NIM requires NVIDIA_API_KEY.');
  }

  const response = await fetch(COSMOS_NIM_ENDPOINT, {
    method: 'POST',
    headers: getNVIDIAHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cosmos NIM error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

function mapCosmosToVLMAnalysis(cosmos: CosmosResponse, videoUploadId: string): VLMAnalysisResult {
  return {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId,
    taskTitle: cosmos.task_title || 'Untitled Task',
    taskDescription: cosmos.task_description || '',
    robotType: cosmos.robot_type || 'arm',
    robotDof: cosmos.robot_dof || 7,
    controlMode: cosmos.control_mode || 'Cartesian Impedance',
    observationSpace: Array.isArray(cosmos.observation_space) ? cosmos.observation_space : ['RGB Camera', 'Joint Encoders'],
    environment: cosmos.environment || 'MuJoCo',
    keyframes: Array.isArray(cosmos.keyframes) ? cosmos.keyframes.map((kf) => ({
      stage: kf.stage,
      timestamp: kf.timestamp,
      gripperState: kf.gripper_state,
      actionDescription: kf.action_description,
    })) : [],
    obstacleConstraints: Array.isArray(cosmos.obstacle_constraints) ? cosmos.obstacle_constraints : [],
    recommendedControlMode: cosmos.recommended_control_mode || 'Cartesian Impedance',
    simToRealTips: Array.isArray(cosmos.sim_to_real_tips) ? cosmos.sim_to_real_tips : [],
    confidence: typeof cosmos.confidence === 'number' ? cosmos.confidence : 0.85,
    analyzedAt: new Date().toISOString(),
  };
}

export async function analyzeVideoWithCosmos(
  videoPath: string,
  prompt: string,
  videoUploadId: string = ''
): Promise<VLMAnalysisResult> {
  const fs = await import('fs');
  const videoBuffer = fs.readFileSync(videoPath);
  const videoBase64 = videoBuffer.toString('base64');

  const payload: CosmosRequest = {
    video: videoBase64,
    text: prompt,
    task: 'robot_task_understanding',
  };

  const cosmosResult = await callCosmosNIM(payload);
  return mapCosmosToVLMAnalysis(cosmosResult, videoUploadId);
}

export async function analyzeDescriptionWithCosmos(
  description: string
): Promise<VLMAnalysisResult> {
  const payload: CosmosRequest = {
    video: '',
    text: description,
    task: 'robot_task_understanding',
  };

  const cosmosResult = await callCosmosNIM(payload);
  return mapCosmosToVLMAnalysis(cosmosResult, '');
}

export function isCosmosAvailable(): boolean {
  return !!NVIDIA_API_KEY;
}