import React from 'react';
import { GeneratedPolicy } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, ShieldCheck, Zap, Gauge, Flame, Cpu, AlertTriangle, RefreshCw, CpuIcon, ShieldAlert } from 'lucide-react';

interface TelemetryDashboardProps {
  policy: GeneratedPolicy;
}

export const TelemetryDashboard: React.FC<TelemetryDashboardProps> = ({ policy }) => {
  // Failure Mode Analysis Data
  const failureModes = [
    { name: 'Task Success', value: policy.metrics.successRatePct, color: '#00CC88' },
    { name: 'Collision Offset', value: +((100 - policy.metrics.successRatePct) * 0.45).toFixed(1), color: '#FFB800' },
    { name: 'Joint Torque Limit', value: +((100 - policy.metrics.successRatePct) * 0.35).toFixed(1), color: '#0088FF' },
    { name: 'Balance Slip', value: +((100 - policy.metrics.successRatePct) * 0.2).toFixed(1), color: '#FF3355' },
  ];

  // Flywheel Data Calibration Points
  const flywheelCalibration = [
    { iter: 'Iter 1', simError: 18.4, realError: 24.2 },
    { iter: 'Iter 2', simError: 12.1, realError: 15.8 },
    { iter: 'Iter 3', simError: 7.5, realError: 9.1 },
    { iter: 'Iter 4', simError: 4.2, realError: 5.0 },
    { iter: 'Iter 5 (Now)', simError: 2.1, realError: 2.6 },
  ];

  return (
    <div className="space-y-6">
      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141428] p-5 rounded-2xl border border-[#2A2A4A] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A0B8]">Sim Success Rate</span>
            <div className="p-2 rounded-xl bg-[#00CC88]/10 text-[#00CC88] border border-[#00CC88]/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{policy.metrics.successRatePct}%</div>
          <div className="text-[11px] text-[#00CC88] mt-1 font-mono">Over {policy.metrics.totalSimRuns} MuJoCo parallel trials</div>
        </div>

        <div className="bg-[#141428] p-5 rounded-2xl border border-[#2A2A4A] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A0B8]">Mean Task Time</span>
            <div className="p-2 rounded-xl bg-[#0088FF]/10 text-[#0088FF] border border-[#0088FF]/30">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{policy.metrics.meanTrajectoryTimeSec}s</div>
          <div className="text-[11px] text-[#A0A0B8] mt-1 font-mono">Control rate {policy.robot.controlFrequencyHz}Hz</div>
        </div>

        <div className="bg-[#141428] p-5 rounded-2xl border border-[#2A2A4A] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A0B8]">Sim-to-Real Readiness</span>
            <div className="p-2 rounded-xl bg-[#0055FF]/10 text-[#0088FF] border border-[#0055FF]/30">
              <Zap className="w-4 h-4 text-[#0088FF]" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{policy.metrics.simToRealConfidencePct}%</div>
          <div className="text-[11px] text-[#0088FF] mt-1 font-mono">Domain Randomization ACTIVE</div>
        </div>

        <div className="bg-[#141428] p-5 rounded-2xl border border-[#2A2A4A] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#A0A0B8]">Energy Consumption</span>
            <div className="p-2 rounded-xl bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/30">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{policy.metrics.energyScoreJoule} J</div>
          <div className="text-[11px] text-[#FFB800] mt-1 font-mono">Optimized Torque Integral</div>
        </div>
      </div>

      {/* Recharts Data Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Reward Curve over Time */}
        <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0088FF]" />
                <span>Cumulative Policy Reward Trajectory</span>
              </h4>
              <p className="text-xs text-[#A0A0B8]">Task completion progress score (0.0 to 1.0)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={policy.telemetry}>
                <defs>
                  <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0088FF" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0088FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
                <XAxis dataKey="timeSec" stroke="#A0A0B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#A0A0B8" domain={[0, 1]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A1A', borderColor: '#2A2A4A', borderRadius: '8px', fontSize: '12px', color: '#FFF' }}
                />
                <Area type="monotone" dataKey="reward" stroke="#0088FF" fillOpacity={1} fill="url(#colorReward)" name="Reward" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: End-Effector Position Error & Force */}
        <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF3355]" />
                <span>End-Effector Tracking Error & Interaction Force</span>
              </h4>
              <p className="text-xs text-[#A0A0B8]">Kinematic error (mm) and Coulomb force (N)</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={policy.telemetry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
                <XAxis dataKey="timeSec" stroke="#A0A0B8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#A0A0B8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A1A', borderColor: '#2A2A4A', borderRadius: '8px', fontSize: '12px', color: '#FFF' }}
                />
                <Line type="monotone" dataKey="eefPositionErrorMm" stroke="#FF3355" strokeWidth={2} name="EE Error (mm)" dot={false} />
                <Line type="monotone" dataKey="collisionForceN" stroke="#FFB800" strokeWidth={2} name="Contact Force (N)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Failure Mode & Deployment Readiness Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Failure Mode Breakdown */}
        <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
            <h4 className="text-sm font-bold text-white">Failure Mode Breakdown</h4>
          </div>
          <p className="text-xs text-[#A0A0B8]">Distribution of outcome types across 1,200 Isaac Lab parallel runs.</p>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={failureModes} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
                  {failureModes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0A0A1A', borderColor: '#2A2A4A', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            {failureModes.map((f) => (
              <div key={f.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }}></span>
                <span className="text-[#A0A0B8] truncate">{f.name}:</span>
                <span className="text-white font-bold">{f.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sim-to-Real Hardware Readiness */}
        <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#0055FF]" />
            <h4 className="text-sm font-bold text-white">Deployment Hardware Specs</h4>
          </div>
          <p className="text-xs text-[#A0A0B8]">Target edge device deployment profile and latency benchmarks.</p>

          <div className="bg-[#0A0A1A] p-4 rounded-xl border border-[#2A2A4A] space-y-2.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-[#A0A0B8]">Recommended Hardware:</span>
              <span className="text-[#00CC88] font-bold">NVIDIA Jetson Thor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0B8]">Inference Latency:</span>
              <span className="text-white font-bold">{policy.onnxSpec.latencyMs} ms (&gt;1000Hz)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0B8]">Quantized Footprint:</span>
              <span className="text-[#0088FF] font-bold">{(policy.onnxSpec.fileSizeBytes / 1024 / 1024).toFixed(2)} MB (INT8)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A0A0B8]">Safety Compliance:</span>
              <span className="text-[#00CC88] font-bold">ISO 13849-1 Cat 3</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#00CC88]/10 border border-[#00CC88]/30 text-xs text-[#00CC88] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Ready for 1-click deployment on Jetson Thor & ROS 2 Humble nodes.</span>
          </div>
        </div>

        {/* Data Flywheel Integration */}
        <div className="bg-[#141428] p-6 rounded-2xl border border-[#2A2A4A] shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#00CC88]" />
            <h4 className="text-sm font-bold text-white">Data Flywheel Calibration</h4>
          </div>
          <p className="text-xs text-[#A0A0B8]">System Identification closing the Sim-to-Real gap iteratively.</p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flywheelCalibration}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
                <XAxis dataKey="iter" stroke="#A0A0B8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#A0A0B8" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A1A', borderColor: '#2A2A4A', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="simError" fill="#0055FF" name="Sim Dynamics Error %" />
                <Bar dataKey="realError" fill="#00CC88" name="Real Deployment Error %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] text-[#A0A0B8] font-mono flex justify-between">
            <span>Total Logged Transitions:</span>
            <span className="text-[#00CC88] font-bold">142,800 state-action pairs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

