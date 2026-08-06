import { RobotModel, SampleVideoDemo, GeneratedPolicy, VideoUpload, VLMAnalysisResult, NVIDIAVideoGenResult, ApprovalDecision, OnnxExportResult, DeploymentRun, CategorizedFailure, ImprovementRecommendation, FlywheelStats, PolicyEvolutionRecord, EvolutionOverview } from '../types';

export const ROBOT_MODELS: RobotModel[] = [
  {
    id: 'franka_panda',
    name: 'Franka Emika Panda',
    manufacturer: 'Franka Robotics',
    type: 'arm',
    dof: 7,
    payloadKg: 3.0,
    controlFrequencyHz: 1000,
    sensors: ['Wrist RGB-D Camera', 'Torque Sensors (7x)', 'Gripper Tactile'],
    description: 'Precision 7-DoF joint-torque controlled robotic arm ideal for delicate assembly and pick-and-place.',
    badge: 'Popular',
    color: 'emerald',
    jointNames: ['panda_joint1', 'panda_joint2', 'panda_joint3', 'panda_joint4', 'panda_joint5', 'panda_joint6', 'panda_joint7'],
    defaultControlMode: 'Cartesian Impedance'
  },
  {
    id: 'ur5e',
    name: 'Universal Robots UR5e',
    manufacturer: 'Universal Robots',
    type: 'arm',
    dof: 6,
    payloadKg: 5.0,
    controlFrequencyHz: 500,
    sensors: ['Wrist Force/Torque Sensor', 'External Overhead RGB-D', 'Joint Encoders'],
    description: 'Industrial cobot arm with high repeatability for pick-and-place, machine tending, and polishing.',
    badge: 'Industrial',
    color: 'sky',
    jointNames: ['shoulder_pan_joint', 'shoulder_lift_joint', 'elbow_joint', 'wrist_1_joint', 'wrist_2_joint', 'wrist_3_joint'],
    defaultControlMode: 'Joint Velocity'
  },
  {
    id: 'unitree_h1',
    name: 'Unitree H1 Humanoid',
    manufacturer: 'Unitree Robotics',
    type: 'humanoid',
    dof: 19,
    payloadKg: 30.0,
    controlFrequencyHz: 1000,
    sensors: ['3D LiDAR', 'Dual Intel RealSense RGB-D', 'IMU 6-Axis', 'Foot Force Sensors'],
    description: 'Full-size bipedal humanoid with agile walking, stair climbing, and dual arm manipulation.',
    badge: 'Flagship',
    color: 'violet',
    jointNames: ['hip_pitch', 'hip_roll', 'hip_yaw', 'knee', 'ankle_pitch', 'shoulder_pitch', 'shoulder_roll', 'elbow'],
    defaultControlMode: 'Action Chunks'
  },
  {
    id: 'kinova_gen3',
    name: 'Kinova Gen3 7-DoF',
    manufacturer: 'Kinova',
    type: 'arm',
    dof: 7,
    payloadKg: 4.0,
    controlFrequencyHz: 1000,
    sensors: ['Integrated 2D/3D Vision', 'Unlimited Rotation Joints', 'Robotiq 2F-85 Gripper'],
    description: 'Lightweight ultra-modular arm with embedded vision and torque feedback.',
    badge: 'Research',
    color: 'amber',
    jointNames: ['joint_1', 'joint_2', 'joint_3', 'joint_4', 'joint_5', 'joint_6', 'joint_7'],
    defaultControlMode: 'Delta EE Pose'
  },
  {
    id: 'shadow_hand',
    name: 'Shadow Dexterous Hand',
    manufacturer: 'Shadow Robot Co.',
    type: 'hand',
    dof: 24,
    payloadKg: 5.0,
    controlFrequencyHz: 1000,
    sensors: ['BioTac Tactile Fingertips', 'Joint Angle Encoders (24x)', 'Tendons Strain Gauges'],
    description: 'Human-like 24-DoF hand designed for complex in-hand object rotation and fine motor manipulation.',
    badge: 'Dexterous',
    color: 'rose',
    jointNames: ['thumb_ph1', 'thumb_ph2', 'index_ph1', 'index_ph2', 'middle_ph1', 'ring_ph1', 'little_ph1'],
    defaultControlMode: 'Action Chunks'
  },
  {
    id: 'turtlebot4',
    name: 'TurtleBot 4 Manipulator',
    manufacturer: 'Clearpath Robotics',
    type: 'mobile_manipulator',
    dof: 11,
    payloadKg: 1.5,
    controlFrequencyHz: 200,
    sensors: ['2D LiDAR', 'OAK-D Spatial AI Camera', 'Wheel Odometry', '3-DoF Arm'],
    description: 'Mobile base with mounted 3-DoF arm for warehouse logistics navigation and item pick-up.',
    badge: 'Mobile',
    color: 'indigo',
    jointNames: ['left_wheel', 'right_wheel', 'arm_base', 'arm_shoulder', 'arm_elbow'],
    defaultControlMode: 'Joint Velocity'
  }
];

export const SAMPLE_VIDEOS: SampleVideoDemo[] = [
  {
    id: 'demo_peg_insert',
    title: 'Precision Peg Insertion in Tight Clearance',
    duration: '0:14',
    robot: 'Franka Emika Panda',
    thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80',
    description: 'Human demonstrator inserting a cylindrical aluminum peg into a tight tolerance hole with visual guidance.',
    keySteps: ['Approach peg from top-down', 'Grasp peg with soft fingertips', 'Align with alignment mark', 'Insert with impedance adaptation']
  },
  {
    id: 'demo_tshirt_fold',
    title: 'Bimanual T-Shirt Folding on Worktable',
    duration: '0:22',
    robot: 'Unitree H1 Humanoid',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    description: 'Demonstrator grabbing shoulders of a cotton garment, executing smooth 2-stage fold sequence.',
    keySteps: ['Pinch shoulder seams', 'Lift and smooth drape', 'Cross arms in mid-air', 'Lower onto surface with flat pressure']
  },
  {
    id: 'demo_cube_reorient',
    title: 'In-Hand Rubik Cube Re-orientation',
    duration: '0:18',
    robot: 'Shadow Dexterous Hand',
    thumbnailUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    description: 'Dexterous finger gaiting to flip a 6cm cube from face 1 to face 6 without dropping.',
    keySteps: ['3-finger tripod pinch', 'Thumb roll under bottom face', 'Index finger push across top', 'Stabilize with palm contact']
  },
  {
    id: 'demo_bottle_pour',
    title: 'Precise Chemical Pouring into Graduated Cylinder',
    duration: '0:19',
    robot: 'Universal Robots UR5e',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
    description: 'Controlled tilt angle pouring of liquid with zero spill and meniscus target level control.',
    keySteps: ['Grasp beaker body', 'Translate over cylinder mouth', 'Modulate rotational velocity (0 to 45 deg)', 'Abrupt reverse tilt at target mark']
  }
];

export const MOCK_VIDEO_UPLOADS: VideoUpload[] = [
  {
    id: 'vid_upload_01',
    fileName: 'peg_insertion_demo.mp4',
    fileSizeBytes: 45000000,
    mimeType: 'video/mp4',
    durationSec: 14,
    resolution: '1080p',
    uploadedAt: '2026-07-31T10:16:32Z',
    localPath: '/uploads/vid_upload_01.mp4',
  },
  {
    id: 'vid_upload_02',
    fileName: 'tshirt_folding_demo.mov',
    fileSizeBytes: 62000000,
    mimeType: 'video/quicktime',
    durationSec: 22,
    resolution: '4K',
    uploadedAt: '2026-07-31T11:30:00Z',
    localPath: '/uploads/vid_upload_02.mov',
  },
];

export const MOCK_VLM_ANALYSES: VLMAnalysisResult[] = [
  {
    id: 'vlm_analysis_01',
    videoUploadId: 'vid_upload_01',
    taskTitle: 'Precision Peg Insertion with Impedance Control',
    taskDescription: 'Pick up cylindrical brass pin and insert into 0.2mm tolerance socket on assembly block.',
    robotType: 'arm',
    robotDof: 7,
    controlMode: 'Cartesian Impedance',
    observationSpace: ['RGB Camera', 'Joint Encoders', 'EE Force/Torque'],
    environment: 'MuJoCo',
    keyframes: [
      { stage: 'Approach', timestamp: '0:00-0:03', gripperState: 'Open', actionDescription: 'Move end-effector above peg with 5cm offset' },
      { stage: 'Grasp', timestamp: '0:03-0:06', gripperState: 'Closing', actionDescription: 'Close gripper with 3N force, verify contact' },
      { stage: 'Align', timestamp: '0:06-0:09', gripperState: 'Gripping', actionDescription: 'Align peg with socket using visual servoing' },
      { stage: 'Insert', timestamp: '0:09-0:14', gripperState: 'Gripping', actionDescription: 'Insert peg with impedance adaptation, 5N contact threshold' },
    ],
    obstacleConstraints: ['Socket overhang 0.5mm', 'Peg tolerance 0.2mm', 'Workspace boundary 0.65m radius'],
    recommendedControlMode: 'Cartesian Impedance',
    simToRealTips: [
      'Apply domain randomization: friction coefficient 0.8-1.2, mass +/-10%',
      'Add Gaussian noise to joint encoders (sigma=0.001 rad) for sim-to-real transfer',
      'Calibrate force-torque sensor bias before each deployment run'
    ],
    confidence: 0.96,
    analyzedAt: '2026-07-31T10:20:00Z',
  },
];

export const MOCK_NVIDIA_VIDEO_RESULTS: NVIDIAVideoGenResult[] = [
  {
    id: 'nvid_vid_01',
    requestId: 'nvid_job_01',
    status: 'complete',
    videoUrl: 'https://storage.nvidia-omniverse.example/jobs/nvid_job_01/output.mp4',
    thumbnailUrl: 'https://storage.nvidia-omniverse.example/jobs/nvid_job_01/thumb.jpg',
    resolution: '1080p',
    durationSec: 10,
    generatedAt: '2026-07-31T10:25:00Z',
    nvidiaJobId: 'nvid_job_01',
  },
];

export const MOCK_APPROVALS: ApprovalDecision[] = [
  {
    id: 'appr_01',
    videoGenId: 'nvid_job_01',
    policyId: 'pol_peg_01',
    decision: 'approved',
    feedback: '',
    approvedAt: '2026-07-31T10:30:00Z',
    rejectedAt: null,
  },
];

export const MOCK_ONNX_EXPORTS: OnnxExportResult[] = [
  {
    id: 'onnx_01',
    policyId: 'pol_peg_01',
    onnxModelUrl: '/exports/onnx/pol_peg_01_policy.onnx',
    onnxModelSizeBytes: 1420000,
    inputShape: '1 x 24',
    outputShape: '1 x 6',
    opsetVersion: 17,
    latencyMs: 0.85,
    exportedAt: '2026-07-31T10:35:00Z',
    exportFormat: 'onnx',
  },
];

export const MOCK_DEPLOYMENT_RUNS: DeploymentRun[] = [
  {
    id: 'run_01',
    policyId: 'pol_peg_01',
    robotModel: 'Franka Emika Panda',
    taskTitle: 'Peg Insertion with Impedance Control',
    outcome: 'failure',
    successScore: 22,
    durationSec: 8.4,
    numAttempts: 2,
    errorSignals: [
      { type: 'contact_jam', severity: 'high', description: 'Insertion wedge detected, contact force exceeded 14N threshold', occurredAtSec: 4.2 },
      { type: 'stability_oscillation', severity: 'medium', description: 'EE oscillated ±4mm before abort', occurredAtSec: 3.6 },
    ],
    environmentFingerprint: 'a1b2c3d4e5f60718',
    deployedAt: '2026-07-31T11:02:00Z',
    source: 'real_world',
  },
  {
    id: 'run_02',
    policyId: 'pol_peg_01',
    robotModel: 'Franka Emika Panda',
    taskTitle: 'Peg Insertion with Impedance Control',
    outcome: 'failure',
    successScore: 41,
    durationSec: 9.1,
    numAttempts: 1,
    errorSignals: [
      { type: 'grasp_slip', severity: 'high', description: 'Object slid out of gripper during lift, tactile signal lost', occurredAtSec: 1.8 },
    ],
    environmentFingerprint: 'a1b2c3d4e5f60718',
    deployedAt: '2026-07-31T11:14:00Z',
    source: 'real_world',
  },
  {
    id: 'run_03',
    policyId: 'pol_peg_01',
    robotModel: 'Franka Emika Panda',
    taskTitle: 'Peg Insertion with Impedance Control',
    outcome: 'success',
    successScore: 96,
    durationSec: 6.2,
    numAttempts: 1,
    errorSignals: [],
    environmentFingerprint: 'a1b2c3d4e5f60718',
    deployedAt: '2026-07-31T11:30:00Z',
    source: 'real_world',
  },
  {
    id: 'run_04',
    policyId: 'pol_humanoid_walk_02',
    robotModel: 'Unitree H1 Humanoid',
    taskTitle: 'Unitree H1 Dynamic Walking & Obstacle Avoidance',
    outcome: 'failure',
    successScore: 18,
    durationSec: 11.7,
    numAttempts: 3,
    errorSignals: [
      { type: 'stability_oscillation', severity: 'critical', description: 'Upper body pitch oscillation diverged, fall detected at t=9.5s', occurredAtSec: 9.5 },
      { type: 'navigation_failure', severity: 'medium', description: 'Localization drift, path re-planned 4 times', occurredAtSec: 5.0 },
    ],
    environmentFingerprint: '9f8e7d6c5b4a3210',
    deployedAt: '2026-07-31T12:05:00Z',
    source: 'real_world',
  },
  {
    id: 'run_05',
    policyId: 'pol_humanoid_walk_02',
    robotModel: 'Unitree H1 Humanoid',
    taskTitle: 'Unitree H1 Dynamic Walking & Obstacle Avoidance',
    outcome: 'success',
    successScore: 92,
    durationSec: 14.3,
    numAttempts: 1,
    errorSignals: [],
    environmentFingerprint: '9f8e7d6c5b4a3210',
    deployedAt: '2026-07-31T12:20:00Z',
    source: 'sim',
  },
];

export const MOCK_CATEGORIZED_FAILURES: CategorizedFailure[] = [
  {
    id: 'fail_01',
    runId: 'run_01',
    policyId: 'pol_peg_01',
    taskTitle: 'Peg Insertion with Impedance Control',
    robotModel: 'Franka Emika Panda',
    category: 'contact_jam',
    severity: 'critical',
    description: 'Peg wedged during insertion with force spike; lateral stiffness too high to self-align.',
    rootCause: 'Insertion velocity too high with rigid alignment; no compliance search motion enabled.',
    recommendedAction: 'Add 1mm sinusoidal search dithering during insertion and lower insertion velocity to 0.006 m/s.',
    confidence: 0.94,
    classifiedAt: '2026-07-31T11:10:00Z',
    classifier: 'llm',
  },
  {
    id: 'fail_02',
    runId: 'run_02',
    policyId: 'pol_peg_01',
    taskTitle: 'Peg Insertion with Impedance Control',
    robotModel: 'Franka Emika Panda',
    category: 'grasp_slip',
    severity: 'high',
    description: 'Object slipped from gripper during lift due to insufficient grasp force.',
    rootCause: 'Insufficient grip force and no tactile contact verification before lift.',
    recommendedAction: 'Increase grip force to 100% max with 2s hold and verify tactile contact before lift.',
    confidence: 0.97,
    classifiedAt: '2026-07-31T11:20:00Z',
    classifier: 'llm',
  },
  {
    id: 'fail_03',
    runId: 'run_04',
    policyId: 'pol_humanoid_walk_02',
    taskTitle: 'Unitree H1 Dynamic Walking & Obstacle Avoidance',
    robotModel: 'Unitree H1 Humanoid',
    category: 'stability_oscillation',
    severity: 'critical',
    description: 'Pitch oscillation diverged causing fall; ankle torque gains too low for uneven terrain.',
    rootCause: 'Impedance gains too aggressive relative to payload dynamics; no disturbance rejection.',
    recommendedAction: 'Reduce upper-body Kp 25%, raise ankle Kd 15%, add low-pass filter on IMU pitch feedback.',
    confidence: 0.91,
    classifiedAt: '2026-07-31T12:10:00Z',
    classifier: 'rules',
  },
];

export const MOCK_IMPROVEMENTS: ImprovementRecommendation[] = [
  {
    id: 'imp_01',
    policyId: 'pol_peg_01',
    policyTitle: 'Peg Insertion with Impedance Control',
    failureCategory: 'contact_jam',
    title: 'Add compliance dithering during insertion',
    description: 'Improvement derived from contact_jam failures. Add 1mm sinusoidal search dithering during insertion.',
    changes: [
      { target: 'Trajectory', parameter: 'Insertion Velocity', from: '0.012 m/s', to: '0.006 m/s' },
      { target: 'Compliance', parameter: 'Search Dither', from: 'None', to: '1 mm sinusoidal' },
      { target: 'Impedance', parameter: 'Lateral Kp', from: '600 N/m', to: '150 N/m' },
    ],
    estimatedGainPct: 15,
    priority: 'critical',
    status: 'pending',
    createdAt: '2026-07-31T11:25:00Z',
    appliedAt: null,
  },
  {
    id: 'imp_02',
    policyId: 'pol_peg_01',
    policyTitle: 'Peg Insertion with Impedance Control',
    failureCategory: 'grasp_slip',
    title: 'Increase grip force & add tactile contact trigger',
    description: 'Improvement derived from grasp_slip failures. Verify tactile contact before lift.',
    changes: [
      { target: 'Gripper', parameter: 'Grip Force', from: '80% max', to: '100% max (2s hold)' },
      { target: 'State Machine', parameter: 'Lift Trigger', from: 'Timed lift after grasp', to: 'Tactile contact verified' },
    ],
    estimatedGainPct: 12,
    priority: 'high',
    status: 'applied',
    createdAt: '2026-07-31T11:26:00Z',
    appliedAt: '2026-07-31T11:40:00Z',
  },
  {
    id: 'imp_03',
    policyId: 'pol_humanoid_walk_02',
    policyTitle: 'Unitree H1 Dynamic Walking & Obstacle Avoidance',
    failureCategory: 'stability_oscillation',
    title: 'Tune impedance gains for stable gait convergence',
    description: 'Improvement derived from stability_oscillation failures on locomotion policy.',
    changes: [
      { target: 'Impedance', parameter: 'Upper-body Kp', from: '600 N/m', to: '450 N/m' },
      { target: 'Impedance', parameter: 'Ankle Kd', from: '2*sqrt(Kp)', to: '2.3*sqrt(Kp)' },
      { target: 'Feedback', parameter: 'IMU Pitch Filter', from: 'None', to: 'Low-pass @ 25 Hz' },
    ],
    estimatedGainPct: 14,
    priority: 'high',
    status: 'pending',
    createdAt: '2026-07-31T12:15:00Z',
    appliedAt: null,
  },
];

export const MOCK_FLYWHEEL_STATS: FlywheelStats = {
  totalRuns: 5,
  successRuns: 2,
  failureRuns: 3,
  passRatePct: 40.0,
  totalFailures: 3,
  categorizedFailures: 3,
  uncategorizedFailures: 0,
  improvementsGenerated: 3,
  improvementsApplied: 1,
  topFailureCategories: [
    { category: 'contact_jam', count: 1 },
    { category: 'grasp_slip', count: 1 },
    { category: 'stability_oscillation', count: 1 },
  ],
};

export const MOCK_EVOLUTION_RECORDS: PolicyEvolutionRecord[] = [
  {
    id: 'evol_01',
    policyId: 'pol_peg_01',
    policyTitle: 'Peg Insertion with Impedance Control',
    version: 1,
    appliedImprovementIds: ['imp_02'],
    appliedImprovementTitles: ['Increase grip force & add tactile contact trigger'],
    changesApplied: [
      { target: 'Gripper', parameter: 'Grip Force', from: '80% max', to: '100% max (2s hold)' },
      { target: 'State Machine', parameter: 'Lift Trigger', from: 'Timed lift after grasp', to: 'Tactile contact verified' },
    ],
    successRateBeforePct: 78.4,
    projectedSuccessRatePct: 90.6,
    measuredSuccessRatePct: 89.2,
    verified: true,
    verificationJobId: 'isaac_sim_verify_001',
    createdAt: '2026-07-31T11:40:00Z',
  },
];

export const MOCK_EVOLUTION_OVERVIEW: EvolutionOverview = {
  policiesEvolved: 1,
  totalVersions: 1,
  latestVersionCount: 1,
  improvementsApplied: 1,
  avgGainPct: 10.8,
  bestGainPct: 10.8,
  verifiedCount: 1,
  measuredCount: 1,
};

export const INITIAL_POLICIES: GeneratedPolicy[] = [
  {
    id: 'pol_peg_01',
    title: 'Peg Insertion with Impedance Control',
    description: 'Pick up cylindrical brass pin and insert into 0.2mm tolerance socket on assembly block.',
    robot: ROBOT_MODELS[0], // Franka
    input: {
      title: 'Peg Insertion with Impedance Control',
      description: 'Pick up cylindrical brass pin and insert into socket',
      robotId: 'franka_panda',
      environment: 'MuJoCo',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['RGB Camera', 'Joint Encoders', 'EE Force/Torque'],
      videoName: 'Precision Peg Insertion in Tight Clearance',
      domainRandomization: true,
      maxExecutionTimeSec: 15
    },
    routing: {
      planType: 'Plan A: Symbolic Trajectory Code',
      confidence: 0.96,
      rationale: 'High precision required with force feedback. Analytical trajectory generator with compliance controller achieves optimal performance.',
      estimatedSimTimeSec: 4.2,
      recommendedModel: 'Gemini 3.6 Flash Robotics ER',
      safetyRating: 'A+'
    },
    status: 'validated',
    pythonCode: `import numpy as np
import mujoco
from spatial_geometry import Transform, SE3

class FrankaPegInsertPolicy:
    """
    Policy-0 Generated Policy: Franka Emika Panda Peg Insertion
    Control Frequency: 1000Hz | Mode: Cartesian Impedance
    """
    def __init__(self, target_socket_pose):
        self.target_socket = target_socket_pose
        self.stiffness = np.diag([600, 600, 400, 50, 50, 50])  # Kp matrix
        self.damping = 2.0 * np.sqrt(self.stiffness)            # Kd matrix
        self.phase = "APPROACH"
        
    def step(self, obs):
        eef_pos = obs['eef_pos']
        eef_quat = obs['eef_quat']
        force_torque = obs['force_torque']
        
        # State machine for insertion trajectory
        if self.phase == "APPROACH":
            desired_pos = self.target_socket[:3] + np.array([0, 0, 0.05])
            if np.linalg.norm(eef_pos - desired_pos) < 0.005:
                self.phase = "ALIGN_CONTACT"
                
        elif self.phase == "ALIGN_CONTACT":
            desired_pos = self.target_socket[:3] + np.array([0, 0, 0.002])
            # Compliance adjustment based on measured z-force
            if force_torque[2] > 5.0:  # 5N contact threshold
                self.phase = "INSERT"
                
        elif self.phase == "INSERT":
            desired_pos = self.target_socket[:3] - np.array([0, 0, 0.030])
            # Reduce lateral stiffness to allow passive compliance alignment
            self.stiffness[0, 0] = 150.0
            self.stiffness[1, 1] = 150.0

        pos_error = desired_pos - eef_pos
        tau = self.stiffness[:3, :3] @ pos_error - self.damping[:3, :3] @ obs['eef_vel']
        return tau`,
    mujocoXml: `<mujoco model="franka_peg_insertion">
  <compiler angle="radiant" coordinate="local" meshdir="meshes/"/>
  <option timestep="0.001" gravity="0 0 -9.81"/>
  <worldbody>
    <light pos="0 0 3" dir="0 0 -1"/>
    <geom name="floor" type="plane" size="2 2 0.1" rgba="0.9 0.9 0.9 1"/>
    <!-- Assembly Worktable -->
    <body name="table" pos="0.5 0 0.4">
      <geom type="box" size="0.4 0.4 0.4" rgba="0.2 0.2 0.25 1"/>
      <!-- Socket Hole Block -->
      <body name="socket_block" pos="0.1 0 0.41">
        <geom type="box" size="0.08 0.08 0.04" rgba="0.7 0.3 0.2 1"/>
        <site name="hole_center" pos="0 0 0.04" size="0.0105"/>
      </body>
    </body>
  </worldbody>
</mujoco>`,
    ros2NodeCode: `#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
from geometry_msgs.msg import WrenchStamped, PoseStamped

class Policy0PegInsertNode(Node):
    def __init__(self):
        super().__init__('policy0_franka_peg_insert')
        self.sub_js = self.create_subscription(JointState, '/franka/joint_states', self.js_cb, 10)
        self.sub_ft = self.create_subscription(WrenchStamped, '/franka/force_torque', self.ft_cb, 10)
        self.pub_cmd = self.create_publisher(JointState, '/franka/joint_commands', 10)
        self.get_logger().info('Policy-0 Peg Insertion ROS2 Controller Running.')

    def js_cb(self, msg):
        pass # Policy execution logic here

    def ft_cb(self, msg):
        pass

def main():
    rclpy.init()
    node = Policy0PegInsertNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()`,
    onnxSpec: {
      inputShape: '1 x 24 (Obs: EEF Pose + Joint Angles + Force)',
      outputShape: '1 x 6 (Delta Cartesian Command)',
      latencyMs: 0.85,
      fileSizeBytes: 1420000
    },
    metrics: {
      successRatePct: 98.4,
      meanTrajectoryTimeSec: 3.8,
      simToRealConfidencePct: 94.2,
      energyScoreJoule: 14.5,
      totalSimRuns: 1250
    },
    telemetry: Array.from({ length: 25 }).map((_, i) => ({
      step: i * 10,
      timeSec: +(i * 0.15).toFixed(2),
      reward: +(Math.min(1.0, (i / 20) ** 1.5 + (Math.sin(i) * 0.03))).toFixed(3),
      jointTorqueAvg: +(12.0 * Math.exp(-i / 8) + 2.5 + Math.random() * 0.5).toFixed(2),
      eefPositionErrorMm: +(Math.max(0.2, 45.0 * Math.exp(-i / 5) + (Math.random() * 0.2))).toFixed(2),
      collisionForceN: i > 12 && i < 16 ? +(8.2 + Math.random() * 2.1).toFixed(1) : +(0.4 + Math.random() * 0.2).toFixed(1),
      actionMagnitude: +(0.8 * Math.exp(-i / 15) + 0.1).toFixed(3)
    })),
    createdAt: '2026-07-31 07:45'
  },
  {
    id: 'pol_humanoid_walk_02',
    title: 'Unitree H1 Dynamic Walking & Obstacle Avoidance',
    description: 'Bipedal gait policy with active balancing for traversing uneven laboratory floors with obstacle detection.',
    robot: ROBOT_MODELS[2], // Unitree H1
    input: {
      title: 'Unitree H1 Dynamic Walking & Obstacle Avoidance',
      description: 'Bipedal gait policy with active balancing',
      robotId: 'unitree_h1',
      environment: 'MuJoCo',
      controlMode: 'Action Chunks',
      observationSpace: ['RGB Camera', 'Depth Map', 'Joint Encoders', 'EE Force/Torque'],
      domainRandomization: true,
      maxExecutionTimeSec: 30
    },
    routing: {
      planType: 'Plan C: Reinforcement Learning (PPO)',
      confidence: 0.94,
      rationale: 'High degree-of-freedom locomotion requires multi-contact dynamics optimization via PPO with domain-randomized physics.',
      estimatedSimTimeSec: 18.5,
      recommendedModel: 'NVIDIA NIM + MuJoCo GPU Vector',
      safetyRating: 'A'
    },
    status: 'validated',
    pythonCode: `import torch
import torch.nn as nn
import numpy as np

class HumanoidActorCritic(nn.Module):
    """
    Policy-0 RL Policy Network for Unitree H1 Bipedal Locomotion
    Input: 64-dim Observation Vector (IMU, Joint Angles, LiDAR Depth)
    Output: 19-dim Joint Target Angle Chunks
    """
    def __init__(self, obs_dim=64, action_dim=19):
        super().__init__()
        self.actor = nn.Sequential(
            nn.Linear(obs_dim, 256),
            nn.ELU(),
            nn.Linear(256, 256),
            nn.ELU(),
            nn.Linear(256, action_dim),
            nn.Tanh()
        )
        self.nominal_joints = np.array([0, 0, -0.4, 0.8, -0.4, 0, 0, -0.4, 0.8, -0.4, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    def forward(self, obs_tensor):
        raw_action = self.actor(obs_tensor)
        target_joints = self.nominal_joints + raw_action.detach().cpu().numpy() * 0.3
        return target_joints`,
    mujocoXml: `<mujoco model="unitree_h1_scene">
  <compiler angle="radiant"/>
  <option timestep="0.002" gravity="0 0 -9.81"/>
  <worldbody>
    <light pos="0 0 5" dir="0 0 -1"/>
    <geom name="ground" type="plane" size="10 10 0.1" rgba="0.15 0.18 0.2 1"/>
    <!-- Obstacles -->
    <geom type="box" pos="2 0 0.05" size="0.3 1.0 0.05" rgba="0.8 0.4 0.1 1"/>
  </worldbody>
</mujoco>`,
    ros2NodeCode: `#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState, Imu

class UnitreeH1PolicyNode(Node):
    def __init__(self):
        super().__init__('policy0_h1_locomotion')
        self.get_logger().info('Unitree H1 Locomotion Policy initialized.')

def main():
    rclpy.init()
    node = UnitreeH1PolicyNode()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()`,
    onnxSpec: {
      inputShape: '1 x 64 (Full Body State)',
      outputShape: '1 x 19 (Joint Position Targets)',
      latencyMs: 1.4,
      fileSizeBytes: 3800000
    },
    metrics: {
      successRatePct: 95.8,
      meanTrajectoryTimeSec: 12.1,
      simToRealConfidencePct: 91.0,
      energyScoreJoule: 184.2,
      totalSimRuns: 4800
    },
    telemetry: Array.from({ length: 25 }).map((_, i) => ({
      step: i * 10,
      timeSec: +(i * 0.3).toFixed(2),
      reward: +(Math.min(1.0, (i / 18) ** 1.2 + (Math.sin(i * 0.5) * 0.04))).toFixed(3),
      jointTorqueAvg: +(45.0 + Math.sin(i * 0.8) * 12.0 + Math.random() * 2.0).toFixed(2),
      eefPositionErrorMm: +(Math.max(1.5, 28.0 * Math.exp(-i / 8) + Math.random() * 0.8)).toFixed(2),
      collisionForceN: +(1.2 + Math.random() * 0.8).toFixed(1),
      actionMagnitude: +(0.65 + Math.sin(i * 0.4) * 0.15).toFixed(3)
    })),
    createdAt: '2026-07-30 16:20'
  }
];
