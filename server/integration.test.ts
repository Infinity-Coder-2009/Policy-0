import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// Mock the external dependencies before importing server
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    files: { upload: vi.fn().mockResolvedValue({ uri: 'mock://video.mp4' }) },
    models: {
      generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify({
        taskTitle: 'Test Task',
        taskDescription: 'Test description',
        robotType: 'arm',
        robotDof: 7,
        controlMode: 'Cartesian Impedance',
        observationSpace: ['RGB Camera', 'Joint Encoders'],
        environment: 'MuJoCo',
        keyframes: [],
        obstacleConstraints: [],
        recommendedControlMode: 'Cartesian Impedance',
        simToRealTips: [],
      }) })
    }
  }))
}));

vi.mock('../server/nimLLM', () => ({
  callNIMLLMStructured: vi.fn().mockResolvedValue({
    title: 'Test Policy',
    pythonCode: 'print("test")',
    onnxInputShape: '1 x 27',
    onnxOutputShape: '1 x 7',
  }),
  isNIMLLMAvailable: vi.fn().mockReturnValue(true),
}));

vi.mock('../server/pipeline/cosmosVLMAnalyzer', () => ({
  analyzeVideoWithCosmos: vi.fn().mockResolvedValue({
    id: 'vlm_test',
    taskTitle: 'Test Task',
    taskDescription: 'Test',
    robotType: 'arm',
    robotDof: 7,
    controlMode: 'Cartesian Impedance',
    observationSpace: ['RGB Camera', 'Joint Encoders'],
    environment: 'MuJoCo',
    keyframes: [],
    obstacleConstraints: [],
    recommendedControlMode: 'Cartesian Impedance',
    simToRealTips: [],
    confidence: 0.9,
    analyzedAt: new Date().toISOString(),
  }),
  analyzeDescriptionWithCosmos: vi.fn().mockResolvedValue({}),
  isCosmosAvailable: vi.fn().mockReturnValue(true),
})); // Fixed: added missing )

vi.mock('../server/pipeline/isaacSimBridge', () => ({
  submitIsaacSimSimulation: vi.fn().mockResolvedValue('sim_test_123'),
  generateSimulationTelemetryIsaacSim: vi.fn().mockReturnValue({
    successRatePct: 95,
    meanTrajectoryTimeSec: 5.0,
    simToRealConfidencePct: 90,
    energyScoreJoule: 100,
    totalSimRuns: 1000,
    telemetry: Array(25).fill({ step: 0, timeSec: 0, reward: 1, jointTorqueAvg: 10, eefPositionErrorMm: 1, collisionForceN: 0, actionMagnitude: 1 }),
    isIsaacSim: true,
    simJobId: 'sim_test_123',
  }),
  getIsaacSimJobStatus: vi.fn().mockResolvedValue({ status: 'completed' }),
  waitForIsaacSimCompletion: vi.fn().mockResolvedValue({ status: 'completed' }),
})); // Fixed: added missing )

vi.mock('../server/pipeline/isaacLabBridge', () => ({
  submitIsaacLabTraining: vi.fn().mockResolvedValue('lab_test_123'),
  getIsaacLabJobStatus: vi.fn().mockResolvedValue({ status: 'completed', checkpoint_url: 'mock://checkpoint.pt' }),
  waitForIsaacLabTrainingCompletion: vi.fn().mockResolvedValue({ status: 'completed', checkpoint_url: 'mock://checkpoint.pt', metrics: { success_rate: 0.9 } }),
})); // Fixed: added missing )

vi.mock('../server/pipeline/isaacSimVideoGenerator', () => ({
  generateIsaacSimRTXVideo: vi.fn().mockResolvedValue({
    id: 'vid_test',
    requestId: 'sim_test',
    status: 'complete',
    videoUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    resolution: '1080p',
    durationSec: 10,
    generatedAt: new Date().toISOString(),
    nvidiaJobId: 'nvid_test',
  }),
  generateSimulatedRTXVideo: vi.fn().mockReturnValue({}),
})); // Fixed: added missing )

vi.mock('../server/pipeline/nvidiaVideoGenerator', () => ({
  generateNVIDIAVideo: vi.fn().mockResolvedValue({}),
  getNVIDIAJobStatus: vi.fn().mockReturnValue(null),
  getNVIDIAJobResult: vi.fn().mockReturnValue(null),
}));

vi.mock('../server/pipeline/onnxExporter', () => ({
  exportPolicyToONNX: vi.fn().mockResolvedValue({}),
  getOnnxExportPath: vi.fn().mockReturnValue(null),
  serveOnnxFile: vi.fn().mockReturnValue(null),
  OnnxExportOptions: {} as any,
}));

vi.mock('../server/pipeline/leappExporter', () => ({
  exportPolicyViaLEAPP: vi.fn().mockResolvedValue({}),
  generateSimulatedLEAPPExport: vi.fn().mockReturnValue({}),
  registerCheckpoint: vi.fn(),
  getCheckpoint: vi.fn().mockReturnValue(null),
  serveLeappMetadataFile: vi.fn().mockReturnValue(null),
  OnnxExportOptions: {} as any,
})); // Fixed: added missing )

vi.mock('../server/pipeline/isaacROSExporter', () => ({
  generateIsaacROSDeployment: vi.fn().mockResolvedValue({}),
  IsaacROSDeploymentPackage: {} as any,
  IsaacROSDeploymentOptions: {} as any,
}));

vi.mock('../server/pipeline/isaacLabBridge', () => ({
  submitIsaacLabTraining: vi.fn().mockResolvedValue('isaac_lab_job_123'),
  getIsaacLabJobStatus: vi.fn().mockResolvedValue(null),
  waitForIsaacLabTrainingCompletion: vi.fn().mockResolvedValue({ status: 'completed', checkpoint_url: 'mock://ckpt.pt' }),
  generateIsaacLabTrainingTelemetry: vi.fn().mockReturnValue({ metrics: {}, telemetry: [] }),
  exportIsaacLabPolicyToONNX: vi.fn().mockResolvedValue({}),
  getIsaacLabTaskName: vi.fn().mockReturnValue('Isaac-Manipulation-Franka-Panda-v0'),
}));

vi.mock('../server/pipeline/osmoClient', () => ({
  submitOSMOJob: vi.fn().mockResolvedValue('osmo_test_123'),
  getOSMOJobStatus: vi.fn().mockResolvedValue({}),
  listOSMOJobs: vi.fn().mockResolvedValue([]),
  cancelOSMOJob: vi.fn().mockResolvedValue({}),
  getOSMOJobArtifacts: vi.fn().mockResolvedValue([]),
  streamOSMOJobLogs: vi.fn().mockResolvedValue({}),
  submitOSMOPipeline: vi.fn().mockResolvedValue('pipeline_123'),
  getOSMOPipeline: vi.fn().mockReturnValue(null),
  listOSMOPipelines: vi.fn().mockResolvedValue([]),
  listRecipes: vi.fn().mockReturnValue([
    { name: 'isaac_sim_policy_training', version: '1.0' },
    { name: 'isaac_lab_rl_training', version: '1.0' },
  ]),
  getOSMOStatus: vi.fn().mockReturnValue({}),
  isOSMOConfigured: vi.fn().mockReturnValue(false),
  RecipeName: 'isaac_sim_policy_training' as any,
})); // Fixed: added missing )

// Import the app after mocks
import { app } from '../server';
import { generateAccessToken } from '../server/middleware/auth';

describe('API Integration Tests', () => {
  let baseUrl: string;
  let authToken: string;

  beforeAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    baseUrl = 'http://localhost:3000';

    // Create a test user and get auth token
    const testUser = { userId: 'test_user_123', email: 'test@policy0.dev', role: 'admin' as const };
    authToken = generateAccessToken(testUser);
  });

  describe('Health & Providers', () => {
    it('GET /api/health should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('ok');
    });

    it('GET /api/vlm/providers should return provider status', async () => {
      const res = await request(app).get('/api/vlm/providers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.providers).toBeDefined();
    });

    it('GET /api/osmo/providers should return OSMO status', async () => {
      const res = await request(app).get('/api/osmo/providers');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('GET /api/osmo/recipes should list recipes', async () => {
      const res = await request(app).get('/api/osmo/recipes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.recipes)).toBe(true);
    });
  });

  describe('Video Upload', () => {
    it('POST /api/upload/video should reject without file', async () => {
      const res = await request(app)
        .post('/api/upload/video')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('VLM Analysis', () => {
    it('POST /api/policy/analyze-vlm should require videoUploadId', async () => {
      const res = await request(app)
        .post('/api/policy/analyze-vlm')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/policy/analyze-description should require description', async () => {
      const res = await request(app)
        .post('/api/policy/analyze-description')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('ONNX Export', () => {
    it('POST /api/policy/onnx-export should require policy', async () => {
      const res = await request(app)
        .post('/api/policy/onnx-export')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Isaac Sim', () => {
    it('GET /api/policy/isaacsim-status/:jobId should return 404 for unknown job', async () => {
      const res = await request(app)
        .get('/api/policy/isaacsim-status/unknown_job')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Isaac Lab', () => {
    it('POST /api/isaaclab/train should require robot and taskTitle', async () => {
      const res = await request(app)
        .post('/api/isaaclab/train')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/isaaclab/train/:jobId should return 404 for unknown job', async () => {
      const res = await request(app)
        .get('/api/isaaclab/train/unknown')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Isaac ROS', () => {
    it('GET /api/policy/isaac-ros-packages should return packages list', async () => {
      const res = await request(app)
        .get('/api/policy/isaac-ros-packages')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.packages)).toBe(true);
    });
  });

  describe('OSMO', () => {
    it('POST /api/osmo/submit should require recipe', async () => {
      const res = await request(app)
        .post('/api/osmo/submit')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/osmo/jobs should list jobs', async () => {
      const res = await request(app)
        .get('/api/osmo/jobs')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.jobs)).toBe(true);
    });

    it('GET /api/osmo/recipes should return recipes', async () => {
      const res = await request(app)
        .get('/api/osmo/recipes')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.recipes)).toBe(true);
      expect(res.body.recipes.length).toBeGreaterThan(0);
    });

    it('POST /api/osmo/pipeline should require stages', async () => {
      const res = await request(app)
        .post('/api/osmo/pipeline')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Approval', () => {
    it('POST /api/policy/approve should require approvalId and decision', async () => {
      const res = await request(app)
        .post('/api/policy/approve')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Telemetry', () => {
    it('POST /api/telemetry/collect should require policyId and outcome', async () => {
      const res = await request(app)
        .post('/api/telemetry/collect')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/telemetry/runs should return runs', async () => {
      const res = await request(app)
        .get('/api/telemetry/runs')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.runs)).toBe(true);
    });

    it('GET /api/telemetry/stats should return stats', async () => {
      const res = await request(app)
        .get('/api/telemetry/stats')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
    });
  });

  describe('Improvements', () => {
    it('GET /api/improvements should return improvements', async () => {
      const res = await request(app)
        .get('/api/improvements')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.improvements)).toBe(true);
    });
  });

  describe('Evolution', () => {
    it('GET /api/evolution/versions should return versions', async () => {
      const res = await request(app)
        .get('/api/evolution/versions')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.versions)).toBe(true);
    });

    it('GET /api/evolution/overview should return overview', async () => {
      const res = await request(app)
        .get('/api/evolution/overview')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.overview).toBeDefined();
    });
  });

  describe('Isaac Lab Checkpoint', () => {
    it('POST /api/isaaclab/register-checkpoint should require policyId and checkpointPath', async () => {
      const res = await request(app)
        .post('/api/isaaclab/register-checkpoint')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/isaaclab/checkpoint/:policyId should return 404 for unknown', async () => {
      const res = await request(app)
        .get('/api/isaaclab/checkpoint/unknown')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('Isaac ROS Download', () => {
    it('GET /api/policy/ros2-download/:policyId should require file param', async () => {
      const res = await request(app)
        .get('/api/policy/ros2-download/test_policy')
        .set('x-api-key', 'policy0-dev-key-change-in-production')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const promises = Array(110).fill(null).map(() =>
        request(app).get('/api/health').set('x-api-key', 'policy0-dev-key-change-in-production')
      );
      const results = await Promise.all(promises);
      const rateLimited = results.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});