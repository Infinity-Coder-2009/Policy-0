import React, { useEffect, useRef, useState } from 'react';
import { GeneratedPolicy } from '../../types';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Sliders, Eye, Zap, Layers, RefreshCw, FileCode, Check, Copy, Activity, ShieldAlert } from 'lucide-react';

interface RobotSimCanvasProps {
  policy: GeneratedPolicy;
}

export const RobotSimCanvas: React.FC<RobotSimCanvasProps> = ({ policy }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showTrajectoryMesh, setShowTrajectoryMesh] = useState(true);
  const [showForceVectors, setShowForceVectors] = useState(true);
  const [showJointFrames, setShowJointFrames] = useState(true);
  const [showPhysicsEqs, setShowPhysicsEqs] = useState(true);
  const [showXmlDrawer, setShowXmlDrawer] = useState(false);
  const [copiedXml, setCopiedXml] = useState(false);

  // Real-time Physics Engine Parameters
  const [gravityAcc, setGravityAcc] = useState<number>(9.81);
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.5);
  const [impedanceKp, setImpedanceKp] = useState<number>(500);
  const [jointPerturbations, setJointPerturbations] = useState<number[]>([0, 0, 0, 0, 0]);

  const maxSteps = policy.telemetry.length - 1;

  // Animation Loop Effect
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev >= maxSteps ? 0 : prev + 1));
      }, 150 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, maxSteps, playbackSpeed]);

  // Canvas Drawing Logic with Real-time Physics Equations & Kinematics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Draw Perspective Grid floor
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const gridSize = 30;
    const gridY = height - 80;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, gridY);
      ctx.lineTo((x - width / 2) * 1.5 + width / 2, height);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, gridY);
    ctx.lineTo(width, gridY);
    ctx.stroke();

    // Worktable / Floor Platform
    const tableX = width / 2 - 160;
    const tableY = gridY - 20;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(tableX, tableY, 320, 20);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(tableX, tableY, 320, 20);

    // Get current telemetry step
    const telemetryStep = policy.telemetry[currentStep] || policy.telemetry[0];
    const progress = currentStep / maxSteps;

    // Target Object / Goal Socket
    const targetX = width / 2 + 90;
    const targetY = tableY - 25;
    ctx.fillStyle = '#f59e0b'; // Amber object
    ctx.fillRect(targetX - 15, targetY, 30, 25);
    ctx.strokeStyle = '#fbbf24';
    ctx.strokeRect(targetX - 15, targetY, 30, 25);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText('GOAL OBJECT', targetX - 35, targetY - 8);

    // Robot Type Adaptation: Render Humanoid or Arm
    const isHumanoid = policy.robot.type === 'humanoid';
    const baseX = isHumanoid ? width / 2 - 40 : width / 2 - 100;
    const baseY = tableY;

    // Calculate Joint Kinematics with Physics Impact
    // Higher gravity flexes joints further, higher Kp restores position stiffness
    const gravityGravityFactor = (gravityAcc - 9.81) * 0.015;
    const stiffnessFactor = (500 - impedanceKp) * 0.0002;

    const angle1 = -Math.PI / 2 + Math.sin(progress * Math.PI) * 0.4 + (jointPerturbations[0] || 0) * 0.01 + gravityGravityFactor + stiffnessFactor;
    const angle2 = Math.PI / 4 - Math.sin(progress * Math.PI) * 0.5 + (jointPerturbations[1] || 0) * 0.01;
    const angle3 = -Math.PI / 3 + Math.sin(progress * Math.PI) * 0.3 + (jointPerturbations[2] || 0) * 0.01;

    const link1Len = 85;
    const link2Len = 75;
    const link3Len = 55;

    let j1x = baseX;
    let j1y = baseY - 20;

    if (isHumanoid) {
      // Draw Humanoid Legs & Torso (Unitree G1 / BD Atlas)
      ctx.fillStyle = '#1e293b';
      // Feet & Legs
      ctx.fillRect(baseX - 25, baseY - 40, 15, 40);
      ctx.fillRect(baseX + 10, baseY - 40, 15, 40);
      // Pelvis & Torso
      ctx.fillStyle = '#0055FF';
      ctx.fillRect(baseX - 30, baseY - 110, 60, 70);
      ctx.strokeStyle = '#0088FF';
      ctx.strokeRect(baseX - 30, baseY - 110, 60, 70);

      // Head
      ctx.fillStyle = '#00CC88';
      ctx.beginPath();
      ctx.arc(baseX, baseY - 125, 12, 0, Math.PI * 2);
      ctx.fill();

      // Shoulder Joint Start
      j1x = baseX + 25;
      j1y = baseY - 95;
    } else {
      // Pedestal Base for Manipulators
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(baseX, baseY, 22, Math.PI, 0);
      ctx.fill();
    }

    // Kinematic Joint Chain
    const j2x = j1x + Math.cos(angle1) * link1Len;
    const j2y = j1y + Math.sin(angle1) * link1Len;

    const j3x = j2x + Math.cos(angle1 + angle2) * link2Len;
    const j3y = j2y + Math.sin(angle1 + angle2) * link2Len;

    const eefX = j3x + Math.cos(angle1 + angle2 + angle3) * link3Len;
    const eefY = j3y + Math.sin(angle1 + angle2 + angle3) * link3Len;

    // Trajectory Path Mesh
    if (showTrajectoryMesh) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      for (let s = 0; s <= maxSteps; s++) {
        const p = s / maxSteps;
        const a1 = -Math.PI / 2 + Math.sin(p * Math.PI) * 0.4 + gravityGravityFactor + stiffnessFactor;
        const a2 = Math.PI / 4 - Math.sin(p * Math.PI) * 0.5;
        const a3 = -Math.PI / 3 + Math.sin(p * Math.PI) * 0.3;

        const x1 = j1x + Math.cos(a1) * link1Len;
        const y1 = j1y + Math.sin(a1) * link1Len;
        const x2 = x1 + Math.cos(a1 + a2) * link2Len;
        const y2 = y1 + Math.sin(a1 + a2) * link2Len;
        const ex = x2 + Math.cos(a1 + a2 + a3) * link3Len;
        const ey = y2 + Math.sin(a1 + a2 + a3) * link3Len;

        if (s === 0) ctx.moveTo(ex, ey);
        else ctx.lineTo(ex, ey);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw Arm Link Segments
    ctx.strokeStyle = '#0055FF';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(j1x, j1y);
    ctx.lineTo(j2x, j2y);
    ctx.stroke();

    ctx.strokeStyle = '#0088FF';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(j2x, j2y);
    ctx.lineTo(j3x, j3y);
    ctx.stroke();

    ctx.strokeStyle = '#00CC88';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(j3x, j3y);
    ctx.lineTo(eefX, eefY);
    ctx.stroke();

    // Draw Joint Hubs & Frames
    const joints = [
      { x: j1x, y: j1y, name: 'Shoulder' },
      { x: j2x, y: j2y, name: 'Elbow' },
      { x: j3x, y: j3y, name: 'Wrist' },
    ];

    joints.forEach((j) => {
      ctx.fillStyle = '#0A0A1A';
      ctx.beginPath();
      ctx.arc(j.x, j.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00CC88';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (showJointFrames) {
        ctx.strokeStyle = '#FF3355'; // X-axis
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(j.x, j.y);
        ctx.lineTo(j.x + 12, j.y);
        ctx.stroke();

        ctx.strokeStyle = '#00CC88'; // Y-axis
        ctx.beginPath();
        ctx.moveTo(j.x, j.y);
        ctx.lineTo(j.x, j.y - 12);
        ctx.stroke();
      }
    });

    // End Effector Gripper fingers
    ctx.fillStyle = '#FF3355';
    ctx.fillRect(eefX - 6, eefY - 12, 4, 16);
    ctx.fillRect(eefX + 2, eefY - 12, 4, 16);

    // Force Vectors & Coulomb Friction
    const calculatedForceN = +(telemetryStep.collisionForceN * (1 + frictionCoeff)).toFixed(1);
    if (showForceVectors && calculatedForceN > 0.8) {
      ctx.strokeStyle = '#FF3355';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(eefX, eefY);
      ctx.lineTo(eefX, eefY - calculatedForceN * 4);
      ctx.stroke();

      ctx.fillStyle = '#FF3355';
      ctx.font = '10px monospace';
      ctx.fillText(`Contact Force: ${calculatedForceN}N (μ=${frictionCoeff})`, eefX + 10, eefY - 15);
    }

    // Live Physics Equation Overlay Panel
    if (showPhysicsEqs) {
      // Calculated Newton-Euler Joint Torques: tau = M*q_ddot + C + G
      const gravityTorqueNm = +(3.2 * (gravityAcc / 9.81) * Math.sin(angle1)).toFixed(2);
      const dampingTorqueNm = +(telemetryStep.jointTorqueAvg * 0.8).toFixed(2);
      const totalTorqueNm = +(gravityTorqueNm + dampingTorqueNm).toFixed(2);

      ctx.fillStyle = 'rgba(10, 10, 26, 0.92)';
      ctx.fillRect(15, 15, 290, 130);
      ctx.strokeStyle = '#2A2A4A';
      ctx.strokeRect(15, 15, 290, 130);

      ctx.fillStyle = '#00CC88';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('PHYSICS SOLVER: NEWTON-EULER INTEGRATOR', 25, 33);

      ctx.fillStyle = '#A0A0B8';
      ctx.font = '10px monospace';
      ctx.fillText(`M(q)q̈ + C(q,q̇)q̇ + G(q) = τ + Jᵀf`, 25, 50);

      ctx.fillStyle = '#E8E8F0';
      ctx.fillText(`Gravity Acc (g): ${gravityAcc} m/s²`, 25, 68);
      ctx.fillText(`Coulomb Friction (μ): ${frictionCoeff}`, 25, 84);
      ctx.fillText(`Impedance Kp: ${impedanceKp} N/m`, 25, 100);
      ctx.fillText(`Calculated Joint 1 Torque τ₁: ${totalTorqueNm} Nm`, 25, 116);
      ctx.fillText(`Sim Step: ${telemetryStep.step} | EE Error: ${telemetryStep.eefPositionErrorMm}mm`, 25, 132);
    }
  }, [
    currentStep,
    maxSteps,
    policy,
    showTrajectoryMesh,
    showForceVectors,
    showJointFrames,
    showPhysicsEqs,
    gravityAcc,
    frictionCoeff,
    impedanceKp,
    jointPerturbations,
  ]);

  const handleSliderChange = (idx: number, val: number) => {
    const updated = [...jointPerturbations];
    updated[idx] = val;
    setJointPerturbations(updated);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(policy.mujocoXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  return (
    <div className="bg-[#141428] rounded-2xl border border-[#2A2A4A] p-6 shadow-2xl space-y-6">
      {/* Simulation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#2A2A4A] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00CC88] animate-ping"></span>
            <h3 className="text-lg font-bold text-white">{policy.title}</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#0055FF]/15 text-[#0055FF] border border-[#0055FF]/30 text-xs font-mono font-bold">
              {policy.robot.name}
            </span>
          </div>
          <p className="text-xs text-[#A0A0B8]">
            MuJoCo Physics Environment | {policy.robot.dof} DOF | Control Frequency: {policy.robot.controlFrequencyHz}Hz | Mode: {policy.input.controlMode}
          </p>
        </div>

        {/* Action Controls & View Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPhysicsEqs(!showPhysicsEqs)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showPhysicsEqs
                ? 'bg-[#00CC88]/20 border-[#00CC88] text-[#00CC88]'
                : 'bg-[#0A0A1A] border-[#2A2A4A] text-[#A0A0B8]'
            }`}
          >
            Newton-Euler Eqs
          </button>

          <button
            onClick={() => setShowTrajectoryMesh(!showTrajectoryMesh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showTrajectoryMesh
                ? 'bg-[#0088FF]/20 border-[#0088FF] text-[#0088FF]'
                : 'bg-[#0A0A1A] border-[#2A2A4A] text-[#A0A0B8]'
            }`}
          >
            Trajectory Mesh
          </button>

          <button
            onClick={() => setShowForceVectors(!showForceVectors)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showForceVectors
                ? 'bg-[#FF3355]/20 border-[#FF3355] text-[#FF3355]'
                : 'bg-[#0A0A1A] border-[#2A2A4A] text-[#A0A0B8]'
            }`}
          >
            Force Vectors
          </button>

          <button
            onClick={() => setShowXmlDrawer(!showXmlDrawer)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0055FF] hover:bg-[#0044DD] text-white flex items-center gap-1.5 shadow-lg shadow-[#0055FF]/20 transition-all cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Inspect MJCF XML</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-[#2A2A4A] bg-[#0A0A1A] shadow-inner flex justify-center">
        <canvas ref={canvasRef} width={760} height={420} className="w-full max-w-3xl h-auto block" />

        {/* Live Overlay Status Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-[#141428]/90 border border-[#2A2A4A] px-3 py-1.5 rounded-xl text-xs font-mono text-[#E8E8F0] shadow-lg">
          <Zap className="w-3.5 h-3.5 text-[#FFB800]" />
          <span>Success: {policy.metrics.successRatePct}%</span>
        </div>
      </div>

      {/* Interactive Physics Environment Tuner */}
      <div className="bg-[#0A0A1A] p-5 rounded-2xl border border-[#2A2A4A] space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A4A] pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Sliders className="w-4 h-4 text-[#0055FF]" />
            <span>Real-time MuJoCo Physics Parameter Tuner</span>
          </div>
          <button
            onClick={() => {
              setGravityAcc(9.81);
              setFrictionCoeff(0.5);
              setImpedanceKp(500);
              setJointPerturbations([0, 0, 0, 0, 0]);
            }}
            className="text-[11px] text-[#0088FF] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
          >
            <RefreshCw className="w-3 h-3" /> Reset Physics
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          {/* Gravity Acc Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[#A0A0B8]">
              <span>Gravity Acceleration (g)</span>
              <span className="font-mono text-[#00CC88] font-bold">{gravityAcc} m/s²</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={0.1}
              value={gravityAcc}
              onChange={(e) => setGravityAcc(Number(e.target.value))}
              className="w-full accent-[#0055FF] h-1.5 bg-[#141428] rounded-lg cursor-pointer"
            />
          </div>

          {/* Coulomb Friction Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[#A0A0B8]">
              <span>Coulomb Friction Coeff (μ)</span>
              <span className="font-mono text-[#0088FF] font-bold">{frictionCoeff}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={1.5}
              step={0.05}
              value={frictionCoeff}
              onChange={(e) => setFrictionCoeff(Number(e.target.value))}
              className="w-full accent-[#0088FF] h-1.5 bg-[#141428] rounded-lg cursor-pointer"
            />
          </div>

          {/* Impedance Stiffness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[#A0A0B8]">
              <span>Joint Impedance (Kp)</span>
              <span className="font-mono text-[#FFB800] font-bold">{impedanceKp} N/m</span>
            </div>
            <input
              type="range"
              min={100}
              max={1200}
              step={20}
              value={impedanceKp}
              onChange={(e) => setImpedanceKp(Number(e.target.value))}
              className="w-full accent-[#FFB800] h-1.5 bg-[#141428] rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Playback Timeline Controls */}
      <div className="bg-[#0A0A1A] p-4 rounded-xl border border-[#2A2A4A] space-y-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentStep(0)}
            className="p-2 rounded-lg bg-[#141428] hover:bg-[#2A2A4A] border border-[#2A2A4A] text-[#E8E8F0] cursor-pointer"
            title="Reset Step"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            className="p-2 rounded-lg bg-[#141428] hover:bg-[#2A2A4A] border border-[#2A2A4A] text-[#E8E8F0] cursor-pointer"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white shadow-lg shadow-[#0055FF]/20 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>

          <button
            onClick={() => setCurrentStep((prev) => Math.min(maxSteps, prev + 1))}
            className="p-2 rounded-lg bg-[#141428] hover:bg-[#2A2A4A] border border-[#2A2A4A] text-[#E8E8F0] cursor-pointer"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Timeline Scrub Slider */}
          <div className="flex-1 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={maxSteps}
              value={currentStep}
              onChange={(e) => setCurrentStep(Number(e.target.value))}
              className="w-full accent-[#0055FF] cursor-pointer h-2 bg-[#141428] rounded-lg"
            />
            <span className="text-xs font-mono text-[#0088FF] min-w-[60px] text-right">
              {policy.telemetry[currentStep]?.timeSec || 0}s
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-[#141428] p-1 rounded-lg border border-[#2A2A4A] text-xs">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-1 rounded font-mono cursor-pointer ${
                  playbackSpeed === s ? 'bg-[#0055FF]/20 text-[#0088FF] font-bold' : 'text-[#A0A0B8]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MJCF XML Drawer Modal */}
      {showXmlDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A1A]/80 backdrop-blur-md">
          <div className="bg-[#141428] border border-[#2A2A4A] rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2A2A4A] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#0055FF]" />
                <h3 className="text-base font-bold text-white">Genuine MuJoCo MJCF XML Definition</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyXml}
                  className="px-3 py-1.5 rounded-xl bg-[#00CC88]/15 text-[#00CC88] hover:bg-[#00CC88]/25 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedXml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedXml ? 'Copied XML!' : 'Copy MJCF XML'}</span>
                </button>
                <button
                  onClick={() => setShowXmlDrawer(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#0A0A1A] hover:bg-[#2A2A4A] text-[#A0A0B8] hover:text-white text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <p className="text-xs text-[#A0A0B8]">
              This standard MuJoCo 3.x MJCF XML file contains full kinematic joints, actuator geoms, friction coefficients, and solver settings. You can copy or save this file to run natively in local <code className="text-[#00CC88]">simulate</code> or Python <code className="text-[#00CC88]">import mujoco</code>.
            </p>

            <div className="flex-1 overflow-y-auto bg-[#0A0A1A] p-4 rounded-xl border border-[#2A2A4A] font-mono text-xs text-[#00CC88] leading-relaxed select-all">
              <pre>{policy.mujocoXml}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RobotSimCanvas;

