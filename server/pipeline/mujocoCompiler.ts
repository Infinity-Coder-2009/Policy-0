export interface MuJoCoCompilerOptions {
  robotId: string;
  robotName: string;
  taskTitle: string;
  environment: string;
  domainRandomization: boolean;
}

export function compileMuJoCoXml(opts: MuJoCoCompilerOptions): string {
  const { robotId, robotName, taskTitle, domainRandomization } = opts;

  const randFriction = domainRandomization ? '0.8 0.005 0.0001' : '1.0 0.005 0.0001';
  const solverParams = domainRandomization ? 'solimp="0.9 0.95 0.001" solref="0.02 1"' : 'solimp="0.95 0.99 0.001" solref="0.01 1"';

  return `<mujoco model="${robotId}_${taskTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}">
  <compiler angle="radiant" coordinate="local" meshdir="meshes/"/>
  <option timestep="0.001" gravity="0 0 -9.81" integrator="RK4"/>
  
  <default>
    <joint limited="true" damping="1.0" armature="0.01"/>
    <geom margin="0.001" friction="${randFriction}" ${solverParams}/>
  </default>

  <asset>
    <texture type="2d" name="grid" builtin="checker" rgb1="0.1 0.12 0.18" rgb2="0.15 0.18 0.25" width="512" height="512"/>
    <material name="grid_mat" texture="grid" texrepeat="10 10" reflectance="0.1"/>
    <material name="robot_metal" rgb="0.8 0.85 0.9" metallic="0.8" roughness="0.2"/>
    <material name="target_mat" rgb="0.9 0.3 0.2" metallic="0.3" roughness="0.4"/>
  </asset>

  <worldbody>
    <light pos="0 0 4" dir="0 0 -1" castshadow="true"/>
    <geom name="floor" type="plane" size="5 5 0.1" material="grid_mat"/>

    <!-- Worktable Platform -->
    <body name="worktable" pos="0.5 0 0.4">
      <geom type="box" size="0.45 0.55 0.4" rgb="0.2 0.25 0.32"/>
      
      <!-- Target Work Object / Fixture -->
      <body name="target_fixture" pos="0.15 0.0 0.41">
        <freejoint name="target_joint"/>
        <geom name="target_object" type="box" size="0.035 0.035 0.04" material="target_mat" mass="0.25"/>
        <site name="target_site" pos="0 0 0.04" size="0.01" rgb="0 1 0"/>
      </body>
    </body>

    <!-- Robot Base Anchor -->
    <body name="robot_base" pos="0 0 0.8">
      <geom type="cylinder" size="0.1 0.4" material="robot_metal"/>
      <site name="eef_force_sensor" pos="0 0 0.8" size="0.02"/>
    </body>
  </worldbody>

  <sensor>
    <force name="eef_wrench_force" site="eef_force_sensor"/>
    <torque name="eef_wrench_torque" site="eef_force_sensor"/>
  </sensor>
</mujoco>`;
}
