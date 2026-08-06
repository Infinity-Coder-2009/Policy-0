export type PlanType = 'Plan A: Symbolic Trajectory Code' | 'Plan B: Neural VLA Policy (ONNX)' | 'Plan C: Reinforcement Learning (PPO)';

export type PolicyStatus = 'queued' | 'analyzing' | 'generating' | 'simulating' | 'validated' | 'failed';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'analyzed' | 'video_generated' | 'approved' | 'rejected' | 'pipeline_complete' | 'error';

export type NVIDIAVideoStatus = 'queued' | 'generating' | 'complete' | 'failed';

export interface RobotModel {
  id: string;
  name: string;
  manufacturer: string;
  type: 'arm' | 'humanoid' | 'mobile_manipulator' | 'hand' | 'rover';
  dof: number;
  payloadKg: number;
  controlFrequencyHz: number;
  sensors: string[];
  description: string;
  badge: string;
  color: string;
  jointNames: string[];
  defaultControlMode: string;
}

export interface TaskInput {
  title: string;
  description: string;
  robotId: string;
  environment: 'MuJoCo' | 'Isaac Sim' | 'Drake' | 'PyBullet';
  controlMode: 'Cartesian Impedance' | 'Joint Velocity' | 'Delta EE Pose' | 'Action Chunks';
  observationSpace: ('RGB Camera' | 'Depth Map' | 'Joint Encoders' | 'EE Force/Torque' | 'Tactile Arrays')[];
  videoName?: string;
  videoUrl?: string;
  domainRandomization: boolean;
  maxExecutionTimeSec: number;
}

export interface VideoUpload {
  id: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  durationSec: number;
  resolution: string;
  uploadedAt: string;
  localPath: string;
}

export interface VLMAnalysisResult {
  id: string;
  videoUploadId: string;
  taskTitle: string;
  taskDescription: string;
  robotType: string;
  robotDof: number;
  controlMode: string;
  observationSpace: string[];
  environment: string;
  keyframes: Array<{
    stage: string;
    timestamp: string;
    gripperState: string;
    actionDescription: string;
  }>;
  obstacleConstraints: string[];
  recommendedControlMode: string;
  simToRealTips: string[];
  confidence: number;
  analyzedAt: string;
}

export interface NVIDIAVideoGenRequest {
  taskTitle: string;
  taskDescription: string;
  robotModel: string;
  robotDof: number;
  controlMode: string;
  resolution: '720p' | '1080p' | '4K';
  durationSec: number;
  domainRandomization: boolean;
}

export interface NVIDIAVideoGenResult {
  id: string;
  requestId: string;
  status: NVIDIAVideoStatus;
  videoUrl: string;
  thumbnailUrl: string;
  resolution: string;
  durationSec: number;
  generatedAt: string;
  nvidiaJobId: string;
  errorMessage?: string;
}

export interface ApprovalDecision {
  id: string;
  videoGenId: string;
  policyId: string | null;
  decision: 'approved' | 'rejected' | 'revision_requested';
  feedback: string;
  approvedAt: string | null;
  rejectedAt: string | null;
}

export interface OnnxExportResult {
  id: string;
  policyId: string;
  onnxModelUrl: string;
  onnxModelSizeBytes: number;
  inputShape: string;
  outputShape: string;
  opsetVersion: number;
  latencyMs: number;
  exportedAt: string;
  exportFormat: 'onnx' | 'tensorrt' | 'onnx-tensorrt';
}

export interface RoutingDecision {
  planType: PlanType;
  confidence: number;
  rationale: string;
  estimatedSimTimeSec: number;
  recommendedModel: string;
  safetyRating: 'A+' | 'A' | 'B';
}

export interface TelemetryPoint {
  step: number;
  timeSec: number;
  reward: number;
  jointTorqueAvg: number;
  eefPositionErrorMm: number;
  collisionForceN: number;
  actionMagnitude: number;
}

export interface GeneratedPolicy {
  id: string;
  title: string;
  description: string;
  robot: RobotModel;
  input: TaskInput;
  routing: RoutingDecision;
  status: PolicyStatus;
  pythonCode: string;
  mujocoXml: string;
  ros2NodeCode: string;
  onnxSpec: {
    inputShape: string;
    outputShape: string;
    latencyMs: number;
    fileSizeBytes: number;
  };
  metrics: {
    successRatePct: number;
    meanTrajectoryTimeSec: number;
    simToRealConfidencePct: number;
    energyScoreJoule: number;
    totalSimRuns: number;
  };
  telemetry: TelemetryPoint[];
  keyframeImages?: string[];
  /** Real Isaac Sim simulation job ID (only present when USE_ISAAC_SIM=true). */
  simJobId?: string | null;
  /** Status of the sim job: 'running' | 'completed' | 'failed' | null. */
  simJobStatus?: string | null;
  /** Honest provenance: 'REAL' only for measured Isaac Sim telemetry, otherwise 'SIMULATED'. */
  mode?: 'SIMULATED' | 'REAL';
  createdAt: string;
}

export interface SampleVideoDemo {
  id: string;
  title: string;
  duration: string;
  robot: string;
  thumbnailUrl: string;
  description: string;
  keySteps: string[];
}

export interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'failed' | 'skipped';
  startedAt: string | null;
  completedAt: string | null;
  result: string | null;
  errorMessage: string | null;
}

export interface FullPipelineRun {
  id: string;
  videoUploadId: string;
  vlmAnalysisId: string;
  videoGenId: string;
  approvalId: string;
  policyId: string | null;
  onnxExportId: string | null;
  steps: PipelineStep[];
  status: 'uploading' | 'analyzing' | 'video_generating' | 'awaiting_approval' | 'pipeline_running' | 'onnx_exporting' | 'complete' | 'failed';
  createdAt: string;
  completedAt: string | null;
}

// ===== Phase 2: Data Moat =====

export type DeploymentOutcome = 'success' | 'failure' | 'partial';

export interface ErrorSignal {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  occurredAtSec: number;
}

export interface DeploymentRun {
  id: string;
  policyId: string;
  robotModel: string;
  taskTitle: string;
  outcome: DeploymentOutcome;
  successScore: number;
  durationSec: number;
  numAttempts: number;
  errorSignals: ErrorSignal[];
  environmentFingerprint: string;
  deployedAt: string;
  source: 'sim' | 'real_world';
}

export type FailureCategory =
  | 'grasp_slip'
  | 'collision_misdetection'
  | 'stability_oscillation'
  | 'timeout'
  | 'target_lost'
  | 'contact_jam'
  | 'joint_limit'
  | 'navigation_failure'
  | 'calibration_drift'
  | 'unknown';

export interface CategorizedFailure {
  id: string;
  runId: string;
  policyId: string;
  taskTitle: string;
  robotModel: string;
  category: FailureCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  rootCause: string;
  recommendedAction: string;
  confidence: number;
  classifiedAt: string;
  classifier: 'llm' | 'rules';
}

export interface ImprovementChange {
  target: string;
  parameter: string;
  from: string;
  to: string;
}

export interface ImprovementRecommendation {
  id: string;
  policyId: string;
  policyTitle: string;
  failureCategory: FailureCategory;
  title: string;
  description: string;
  changes: ImprovementChange[];
  estimatedGainPct: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'applied';
  createdAt: string;
  appliedAt: string | null;
}

export interface FlywheelStats {
  totalRuns: number;
  successRuns: number;
  failureRuns: number;
  passRatePct: number;
  totalFailures: number;
  categorizedFailures: number;
  uncategorizedFailures: number;
  improvementsGenerated: number;
  improvementsApplied: number;
  topFailureCategories: Array<{ category: FailureCategory; count: number }>;
}

// ===== Phase 3: Self-Improving System =====

export interface PolicyEvolutionRecord {
  id: string;
  policyId: string;
  policyTitle: string;
  version: number;
  appliedImprovementIds: string[];
  appliedImprovementTitles: string[];
  changesApplied: ImprovementChange[];
  successRateBeforePct: number;
  projectedSuccessRatePct: number;
  measuredSuccessRatePct?: number;
  verified: boolean;
  verificationJobId?: string;
  createdAt: string;
}

export interface EvolutionOverview {
  policiesEvolved: number;
  totalVersions: number;
  latestVersionCount: number;
  improvementsApplied: number;
  avgGainPct: number;
  bestGainPct: number;
  verifiedCount: number;
  measuredCount: number;
}

export interface EvolvedPolicy {
  policy: GeneratedPolicy;
  record: PolicyEvolutionRecord;
}
