export interface Ros2ExporterOptions {
  robotId: string;
  robotName: string;
  taskTitle: string;
  dof: number;
  controlMode: string;
}

export function exportRos2Node(opts: Ros2ExporterOptions): string {
  const { robotId, robotName, taskTitle, dof, controlMode } = opts;

  return `#!/usr/bin/env python3
"""
Policy-0 Auto-Generated ROS2 Execution Node
Robot: ${robotName} (${dof}-DoF)
Task: ${taskTitle}
Control Mode: ${controlMode}
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState, Image
from geometry_msgs.msg import WrenchStamped, PoseStamped
from std_msgs.msg import Float64MultiArray
import numpy as np

class Policy0ExecutorNode(Node):
    def __init__(self):
        super().__init__('policy0_${robotId}_executor')
        
        # ROS2 Parameter Declarations
        self.declare_parameter('control_rate_hz', 1000)
        self.declare_parameter('max_joint_torque', 87.0)
        self.declare_parameter('impedance_kp', [600.0, 600.0, 400.0])
        
        # Subscriptions
        self.sub_joint_states = self.create_subscription(
            JointState,
            '/${robotId}/joint_states',
            self.joint_state_callback,
            10
        )
        self.sub_force_torque = self.create_subscription(
            WrenchStamped,
            '/${robotId}/force_torque',
            self.force_torque_callback,
            10
        )

        # Publishers
        self.pub_cmd = self.create_publisher(
            Float64MultiArray,
            '/${robotId}/joint_group_effort_controller/commands',
            10
        )

        self.rate_hz = self.get_parameter('control_rate_hz').value
        self.timer = self.create_timer(1.0 / self.rate_hz, self.control_loop)
        
        self.latest_joint_pos = np.zeros(${dof})
        self.latest_joint_vel = np.zeros(${dof})
        self.latest_wrench = np.zeros(6)
        self.step_counter = 0

        self.get_logger().info('Policy-0 ROS2 Executor Node running at %d Hz for ${robotName}' % self.rate_hz)

    def joint_state_callback(self, msg: JointState):
        if len(msg.position) >= ${dof}:
            self.latest_joint_pos = np.array(msg.position[:${dof}])
            self.latest_joint_vel = np.array(msg.velocity[:${dof}])

    def force_torque_callback(self, msg: WrenchStamped):
        w = msg.wrench
        self.latest_wrench = np.array([w.force.x, w.force.y, w.force.z, w.torque.x, w.torque.y, w.torque.z])

    def control_loop(self):
        self.step_counter += 1
        # Policy-0 Compliance Evaluation
        cmd_msg = Float64MultiArray()
        # Impedance torque calculation stub
        tau = -0.1 * self.latest_joint_vel
        cmd_msg.data = tau.tolist()
        self.pub_cmd.publish(cmd_msg)

def main(args=None):
    rclpy.init(args=args)
    node = Policy0ExecutorNode()
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
