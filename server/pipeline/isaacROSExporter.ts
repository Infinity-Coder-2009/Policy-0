import path from 'path';
import fs from 'fs';
import { GeneratedPolicy, OnnxExportResult } from '../../src/types';
import { OnnxExportOptions } from './onnxExporter';

// ===== Output types =====
export interface IsaacROSDeploymentPackage {
  packageName: string;
  ros2Workspace: string;
  files: Array<{
    relativePath: string;
    content: string;
    description: string;
  }>;
  onnxModelPath: string;
  tensorrtEnginePath?: string;
  launchFiles: string[];
  configFiles: string[];
  dockerfile: string;
  composeFile: string;
  readme: string;
  generatedAt: string;
}

export interface IsaacROSDeploymentOptions {
  policy: GeneratedPolicy;
  onnxExport?: OnnxExportResult | null;
  /** Optional LEAPP metadata sidecar (for normalization params) */
  leappMetadata?: {
    observationKeys: string[];
    actionKeys: string[];
    normalization: { mean: number[]; std: number[] };
  } | null;
  /** Output directory; defaults to exports/<policyId>/ros2_ws */
  outputDir?: string;
  /** Whether to actually write files to disk (default true) */
  writeFiles?: boolean;
}

// ===== Package name helper =====
function makePackageName(robotId: string, policyId: string): string {
  const safeRobot = robotId.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  const safePolicy = policyId.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
  return `policy0_${safeRobot}_${safePolicy}`;
}

// ===== Main entry point =====
export function generateIsaacROSDeployment(
  options: IsaacROSDeploymentOptions
): IsaacROSDeploymentPackage {
  const { policy, onnxExport, leappMetadata, outputDir, writeFiles = true } = options;

  const packageName = makePackageName(policy.robot.id, policy.id);
  const workspaceRoot = outputDir
    ? path.resolve(outputDir)
    : path.join(process.cwd(), 'exports', policy.id, 'ros2_ws');

  const files: IsaacROSDeploymentPackage['files'] = [];

  // 1. Launch file (XML)
  const launchFileName = `${packageName}_deploy.launch.py`;
  const launchContent = buildLaunchFile(packageName, policy, onnxExport, leappMetadata);
  files.push({
    relativePath: path.join('src', packageName, 'launch', launchFileName),
    content: launchContent,
    description: 'ROS2 launch file wiring Isaac ROS DNN inference node to robot topics',
  });

  // 2. DNN inference config (YAML)
  const dnnConfigFileName = 'dnn_inference.yaml';
  const dnnConfigContent = buildDNNConfig(policy, onnxExport, leappMetadata);
  files.push({
    relativePath: path.join('src', packageName, 'config', dnnConfigFileName),
    content: dnnConfigContent,
    description: 'DNN inference parameters (model path, TensorRT precision, normalization)',
  });

  // 3. Robot interface node (Python) — bridges ROS2 sensor topics to DNN input
  const robotInterfaceFileName = 'robot_interface_node.py';
  const robotInterfaceContent = buildRobotInterfaceNode(policy, packageName);
  files.push({
    relativePath: path.join('src', packageName, 'scripts', robotInterfaceFileName),
    content: robotInterfaceContent,
    description: 'Bridges robot sensor topics -> DNN observation tensor -> action publisher',
  });

  // 4. package.xml
  const packageXmlContent = buildPackageXml(packageName, policy);
  files.push({
    relativePath: path.join('src', packageName, 'package.xml'),
    content: packageXmlContent,
    description: 'ROS2 package manifest declaring Isaac ROS dependencies',
  });

  // 5. CMakeLists.txt
  const cmakelistsContent = buildCMakeLists(packageName);
  files.push({
    relativePath: path.join('src', packageName, 'CMakeLists.txt'),
    content: cmakelistsContent,
    description: 'Colcon build manifest for ROS2 package',
  });

  // 6. Dockerfile
  const dockerfileContent = buildDockerfile(packageName);
  files.push({
    relativePath: 'Dockerfile',
    content: dockerfileContent,
    description: 'Container build file using nvcr.io/nvidia/isaac-ros:humble-2024.1 base',
  });

  // 7. docker-compose.yml
  const composeContent = buildComposeFile(packageName);
  files.push({
    relativePath: 'docker-compose.yml',
    content: composeContent,
    description: 'Compose file enabling GPU runtime for inference container',
  });

  // 8. README
  const readmeContent = buildREADME(packageName, policy, onnxExport, leappMetadata);
  files.push({
    relativePath: 'README.md',
    content: readmeContent,
    description: 'Deployment instructions and topic interface reference',
  });

  const onnxModelPath = onnxExport?.onnxModelUrl || `/exports/onnx/${policy.id}_leapp.onnx`;

  if (writeFiles) {
    writeFileTree(workspaceRoot, files);
    console.log(`Isaac ROS: Deployment package written to ${workspaceRoot}`);
  }

  return {
    packageName,
    ros2Workspace: workspaceRoot,
    files,
    onnxModelPath,
    launchFiles: [launchFileName],
    configFiles: [dnnConfigFileName],
    dockerfile: dockerfileContent,
    composeFile: composeContent,
    readme: readmeContent,
    generatedAt: new Date().toISOString(),
  };
}

// ===== File tree writer =====
function writeFileTree(
  root: string,
  files: IsaacROSDeploymentPackage['files']
): void {
  for (const file of files) {
    const fullPath = path.join(root, file.relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, file.content);
  }
}

// ===== Launch file =====
function buildLaunchFile(
  packageName: string,
  policy: GeneratedPolicy,
  onnxExport: OnnxExportResult | null | undefined,
  leappMetadata: IsaacROSDeploymentOptions['leappMetadata']
): string {
  const modelPath = onnxExport?.onnxModelUrl
    ? `/models${onnxExport.onnxModelUrl.replace(/^.*\/exports\/onnx/, '')}`
    : '/models/policy.onnx';
  const obsKey = leappMetadata?.observationKeys?.[0] || 'observation';
  const actKey = leappMetadata?.actionKeys?.[0] || 'action';

  return `"""${packageName} deployment launch file.

Wires Isaac ROS DNN inference node to robot sensor topics.
Generated by Policy-0 Phase 7 (Isaac ROS Exporter).
"""
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
import os


def generate_launch_description():
    model_path = LaunchConfiguration('model_path')
    enable_tensorrt = LaunchConfiguration('enable_tensorrt')

    return LaunchDescription([
        DeclareLaunchArgument(
            'model_path',
            default_value='${modelPath}',
            description='Path to ONNX/TensorRT policy model'),
        DeclareLaunchArgument(
            'enable_tensorrt',
            default_value='true',
            description='Use TensorRT optimized inference engine'),

        # Isaac ROS DNN Inference node (loads policy ONNX, runs on GPU)
        Node(
            package='isaac_ros_dnn_inference',
            executable='dnn_inference_node',
            name='policy_inference',
            parameters=[{
                'model_file_path': model_path,
                'input_tensor_names': ['${obsKey}'],
                'output_tensor_names': ['${actKey}'],
                'enable_tensorrt': enable_tensorrt,
                'tensorrt_precision': 'fp16',
                'force_engine_update': False,
                'engine_cache_path': '/tmp/trt_engines',
            }],
            remappings=[
                ('input_tensor', '/policy/observation'),
                ('output_tensor', '/policy/action'),
            ],
            output='screen',
        ),

        # Robot-specific interface node (sensors -> observation, action -> robot)
        Node(
            package='${packageName}',
            executable='robot_interface_node',
            name='robot_interface',
            parameters=[{
                'control_rate_hz': ${policy.robot.controlFrequencyHz},
                'dof': ${policy.robot.dof},
                'observation_keys': ${JSON.stringify(leappMetadata?.observationKeys || ['joint_pos', 'joint_vel', 'ee_pos'])},
                'action_keys': ${JSON.stringify(leappMetadata?.actionKeys || ['joint_target_pos'])},
            }],
            output='screen',
        ),
    ])
`;
}

// ===== DNN inference config YAML =====
function buildDNNConfig(
  policy: GeneratedPolicy,
  onnxExport: OnnxExportResult | null | undefined,
  leappMetadata: IsaacROSDeploymentOptions['leappMetadata']
): string {
  const modelPath = onnxExport?.onnxModelUrl
    ? `/models/${path.basename(onnxExport.onnxModelUrl)}`
    : '/models/policy.onnx';
  const inputShape = onnxExport?.inputShape || `[1, ${policy.robot.dof * 3 + 6}]`;
  const outputShape = onnxExport?.outputShape || `[1, ${policy.robot.dof}]`;
  const mean = leappMetadata?.normalization?.mean || new Array(policy.robot.dof * 3 + 6).fill(0);
  const std = leappMetadata?.normalization?.std || new Array(policy.robot.dof * 3 + 6).fill(1);

  return `# DNN inference config for policy ${policy.id}
# Generated by Policy-0 Phase 7 Isaac ROS Exporter
dnn_inference:
  ros__parameters:
    model_file_path: "${modelPath}"
    input_tensor_names: ["observation"]
    output_tensor_names: ["action"]
    enable_tensorrt: true
    tensorrt_precision: "fp16"
    input_binding_names: ["observation"]
    output_binding_names: ["action"]
    force_engine_update: false
    engine_cache_path: "/tmp/trt_engines"
    input_shape: ${inputShape}
    output_shape: ${outputShape}
    opset_version: ${onnxExport?.opsetVersion || 17}
    latency_ms: ${onnxExport?.latencyMs ?? policy.onnxSpec.latencyMs}

normalization:
  mean: [${mean.join(', ')}]
  std: [${std.join(', ')}]
  # Apply (x - mean) / std before feeding to DNN; critical for trained policies

policy_metadata:
  policy_id: "${policy.id}"
  task: "${policy.title.replace(/"/g, '\\"')}"
  robot: "${policy.robot.id}"
  dof: ${policy.robot.dof}
  control_mode: "${policy.input.controlMode}"
  observation_keys: ${JSON.stringify(leappMetadata?.observationKeys || ['joint_pos', 'joint_vel', 'ee_pos'])}
  action_keys: ${JSON.stringify(leappMetadata?.actionKeys || ['joint_target_pos'])}
`;
}

// ===== Robot interface node (Python) =====
function buildRobotInterfaceNode(policy: GeneratedPolicy, packageName: string): string {
  const dof = policy.robot.dof;
  return `#!/usr/bin/env python3
"""${packageName} robot interface node.

Bridges native robot sensor topics -> policy observation tensor,
and policy action output -> robot command topic.
Generated by Policy-0 Phase 7 Isaac ROS Exporter.
"""
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
from geometry_msgs.msg import WrenchStamped, PoseStamped
from std_msgs.msg import Float32MultiArray
import numpy as np


class RobotInterfaceNode(Node):
    def __init__(self):
        super().__init__('robot_interface')

        self.declare_parameter('control_rate_hz', ${policy.robot.controlFrequencyHz})
        self.declare_parameter('dof', ${dof})
        self.declare_parameter('observation_keys', ['joint_pos', 'joint_vel', 'ee_pos'])
        self.declare_parameter('action_keys', ['joint_target_pos'])

        self.dof = self.get_parameter('dof').value
        self.obs_keys = self.get_parameter('observation_keys').value
        self.act_keys = self.get_parameter('action_keys').value

        # Sensor subscriptions
        self.create_subscription(JointState, '/${policy.robot.id}/joint_states',
                                 self._on_joint, 10)
        self.create_subscription(WrenchStamped, '/${policy.robot.id}/force_torque',
                                  self._on_wrench, 10)
        self.create_subscription(PoseStamped, '/${policy.robot.id}/ee_pose',
                                  self._on_ee_pose, 10)

        # DNN output subscription -> robot command
        self.create_subscription(Float32MultiArray, '/policy/action',
                                  self._on_action, 10)

        # Sensor aggregator -> DNN input
        self.obs_pub = self.create_publisher(Float32MultiArray, '/policy/observation', 10)

        self.joint_pos = np.zeros(${dof})
        self.joint_vel = np.zeros(${dof})
        self.wrench = np.zeros(6)
        self.ee_pose = np.zeros(7)  # x,y,z + qx,qy,qz,qw

        rate = self.get_parameter('control_rate_hz').value or 100
        self.create_timer(1.0 / rate, self._tick)
        self.get_logger().info(
            f'robot_interface node online: dof={self.dof}, rate={rate}Hz')

    def _on_joint(self, msg: JointState):
        if len(msg.position) >= self.dof:
            self.joint_pos = np.array(msg.position[:self.dof])
            self.joint_vel = np.array(msg.velocity[:self.dof]) if msg.velocity else self.joint_vel

    def _on_wrench(self, msg: WrenchStamped):
        w = msg.wrench
        self.wrench = np.array([w.force.x, w.force.y, w.force.z,
                                w.torque.x, w.torque.y, w.torque.z])

    def _on_ee_pose(self, msg: PoseStamped):
        p = msg.pose.position
        q = msg.pose.orientation
        self.ee_pose = np.array([p.x, p.y, p.z, q.x, q.y, q.z, q.w])

    def _tick(self):
        # Assemble observation vector in policy-defined key order
        obs = np.concatenate([self.joint_pos, self.joint_vel, self.wrench, self.ee_pose])
        obs_msg = Float32MultiArray(data=obs.astype(np.float32).tolist())
        self.obs_pub.publish(obs_msg)

    def _on_action(self, msg: Float32MultiArray):
        # Forward first dof entries to robot command topic
        cmd = Float32MultiArray(data=msg.data[:self.dof])
        self.create_publisher(Float32MultiArray,
                              '/${policy.robot.id}/joint_group_effort_controller/commands',
                              10).publish(cmd)


def main(args=None):
    rclpy.init(args=args)
    node = RobotInterfaceNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
`;
}

// ===== package.xml =====
function buildPackageXml(packageName: string, policy: GeneratedPolicy): string {
  return `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>${packageName}</name>
  <version>0.1.0</version>
  <description>Auto-generated Policy-0 deployment for ${policy.robot.name} (${policy.robot.dof}-DoF).</description>
  <maintainer email="policy0@example.com">Policy-0 Studio</maintainer>
  <license>MIT</license>

  <buildtool_depend>ament_cmake</buildtool_depend>

  <exec_depend>rclpy</exec_depend>
  <exec_depend>std_msgs</exec_depend>
  <exec_depend>sensor_msgs</exec_depend>
  <exec_depend>geometry_msgs</exec_depend>
  <exec_depend>isaac_ros_dnn_inference</exec_depend>

  <test_depend>ament_lint_auto</test_depend>
  <test_depend>ament_lint_common</test_depend>

  <export>
    <build_type>ament_cmake</build_type>
  </export>
</package>
`;
}

// ===== CMakeLists.txt =====
function buildCMakeLists(packageName: string): string {
  return `cmake_minimum_required(VERSION 3.8)
project(${packageName})

find_package(ament_cmake REQUIRED)
find_package(rclpy REQUIRED)

install(PROGRAMS scripts/robot_interface_node.py
  DESTINATION lib/${packageName}
  RENAME robot_interface_node
)

install(DIRECTORY launch config
  DESTINATION share/${packageName}
)

ament_package()
`;
}

// ===== Dockerfile =====
function buildDockerfile(packageName: string): string {
  return `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/isaac-ros:humble-2024.1

# Install policy-specific Python deps
RUN apt-get update && apt-get install -y --no-install-recommends \\
    python3-pip \\
    python3-numpy \\
    ros-humble-std-msgs ros-humble-sensor-msgs ros-humble-geometry-msgs \\
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir numpy

# Copy policy ONNX model and configs into image
COPY models/policy.onnx /models/policy.onnx
COPY src/${packageName}/config/dnn_inference.yaml /config/dnn_inference.yaml

# ROS2 workspace
WORKDIR /workspace
COPY src/ src/

# Build workspace
RUN /bin/bash -c "source /opt/ros/humble/setup.bash && colcon build --symlink-install"

# ros_entrypoint sources both base and workspace overlays
COPY ros_entrypoint.sh /ros_entrypoint.sh
RUN chmod +x /ros_entrypoint.sh

ENTRYPOINT ["/ros_entrypoint.sh"]
CMD ["ros2", "launch", "${packageName}", "${packageName}_deploy.launch.py"]
`;
}

// ===== docker-compose.yml =====
function buildComposeFile(packageName: string): string {
  return `version: '3.8'
services:
  ${packageName}:
    build: .
    image: ${packageName}:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
      - ROS_DOMAIN_ID=0
      - RMW_IMPLEMENTATION=rmw_fastrtps_cpp
    volumes:
      - ./models:/models:ro
      - ./config:/config:ro
      - trt_cache:/tmp/trt_engines
    network_mode: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  trt_cache:
`;
}

// ===== README.md =====
function buildREADME(
  packageName: string,
  policy: GeneratedPolicy,
  onnxExport: OnnxExportResult | null | undefined,
  leappMetadata: IsaacROSDeploymentOptions['leappMetadata']
): string {
  const obsKeys = leappMetadata?.observationKeys || ['joint_pos', 'joint_vel', 'ee_pos'];
  const actKeys = leappMetadata?.actionKeys || ['joint_target_pos'];
  const mean = leappMetadata?.normalization?.mean || [];
  const std = leappMetadata?.normalization?.std || [];

  return `# ${packageName} Deployment Package

Auto-generated by **Policy-0 Studio Phase 7 Isaac ROS Exporter**.

## Policy
- **Title**: ${policy.title}
- **ID**: \`${policy.id}\`
- **Robot**: ${policy.robot.name} (${policy.robot.manufacturer}) — ${policy.robot.dof}-DoF
- **Control mode**: ${policy.input.controlMode}
- **Control frequency**: ${policy.robot.controlFrequencyHz} Hz
- **Plan type**: ${policy.routing.planType}

## ONNX model
- **Format**: ${onnxExport?.exportFormat || 'onnx'}
- **Input shape**: ${onnxExport?.inputShape || '[1, ...]'}
- **Output shape**: ${onnxExport?.outputShape || '[1, ...]'}
- **Opset**: ${onnxExport?.opsetVersion || 17}
- **Inference latency**: ${onnxExport?.latencyMs ?? policy.onnxSpec.latencyMs} ms
- **Size**: ${((onnxExport?.onnxModelSizeBytes ?? policy.onnxSpec.fileSizeBytes) / 1024).toFixed(1)} KB

## Quick start

1. Place the policy ONNX at \`${onnxExport?.onnxModelUrl ? `./models/${path.basename(onnxExport.onnxModelUrl)}` : './models/policy.onnx'}\`
2. Build and launch:
   \`\`\`bash
   docker compose up --build
   \`\`\`

## ROS2 topics

| Direction | Topic | Type |
|-----------|-------|------|
| Input | \`/${policy.robot.id}/joint_states\` | \`sensor_msgs/JointState\` |
| Input | \`/${policy.robot.id}/force_torque\` | \`geometry_msgs/WrenchStamped\` |
| Input | \`/${policy.robot.id}/ee_pose\` | \`geometry_msgs/PoseStamped\` |
| Internal | \`/policy/observation\` | \`std_msgs/Float32MultiArray\` |
| Internal | \`/policy/action\` | \`std_msgs/Float32MultiArray\` |
| Output | \`/${policy.robot.id}/joint_group_effort_controller/commands\` | \`std_msgs/Float32MultiArray\` |

## Normalization

The ONNX model expects input normalized using LEAPP-provided statistics:

| Key | Mean | Std |
|-----|------|-----|
| observation | [${mean.slice(0, 8).join(', ')}${mean.length > 8 ? ', ...' : ''}] | [${std.slice(0, 8).join(', ')}${std.length > 8 ? ', ...' : ''}] |

Apply \`(x - mean) / std\` before inference. See \`config/dnn_inference.yaml\` for full values.

## Observation / action keys

- **Observation keys**: \`${obsKeys.join('`, `')}\`
- **Action keys**: \`${actKeys.join('`, `')}\`

## Files in this package

| Path | Purpose |
|------|---------|
| \`Dockerfile\` | Container build (base: nvcr.io/nvidia/isaac-ros:humble-2024.1) |
| \`docker-compose.yml\` | Compose file with GPU runtime |
| \`src/${packageName}/launch/${packageName}_deploy.launch.py\` | Launch file |
| \`src/${packageName}/config/dnn_inference.yaml\` | DNN inference params |
| \`src/${packageName}/scripts/robot_interface_node.py\` | Sensor ↔ DNN bridge |
| \`src/${packageName}/package.xml\` | ROS2 manifest |
| \`src/${packageName}/CMakeLists.txt\` | Colcon build file |

## TensorRT cache

First launch builds and caches the optimized engine at \`/tmp/trt_engines\` (persisted via the \`trt_cache\` volume). Subsequent launches skip the engine build (\`force_engine_update: false\`).

## Notes

- This package uses Isaac ROS DNN Inference GEM (\`isaac_ros_dnn_inference\`) for GPU-accelerated ONNX/TensorRT inference with zero-copy (NITROS) data flow.
- The robot-specific interface node may need adapting to your real robot's controller topic names.
- Generated: ${new Date().toISOString()}
`;
}
