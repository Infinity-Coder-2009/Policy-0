export type PlanType = 'Plan A: Symbolic Trajectory Code' | 'Plan B: Neural VLA Policy (ONNX)' | 'Plan C: Reinforcement Learning (PPO)';

export type PolicyStatus = 'queued' | 'analyzing' | 'generating' | 'simulating' | 'validated' | 'failed';

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
