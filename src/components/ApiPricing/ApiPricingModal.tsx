import React, { useState } from 'react';
import { DollarSign, Cpu, ShieldCheck, Zap, Key, Calculator, Check, ExternalLink } from 'lucide-react';

interface ApiPricingModalProps {
  onClose?: () => void;
}

export const ApiPricingModal: React.FC<ApiPricingModalProps> = ({ onClose }) => {
  const [gpuHours, setGpuHours] = useState<number>(5);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'cluster' | 'enterprise'>('cluster');

  const hourlyRate = 100;
  const estimatedTotal = gpuHours * hourlyRate;

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Simulation API Tier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Scalable Cloud Physics & Policy Generation
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Policy-0 provides free local compilation & Colab validation, with high-throughput cloud GPU cluster acceleration for large-scale RL & Domain Randomization.
          </p>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Freemium */}
        <div
          onClick={() => setSelectedPlan('free')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            selectedPlan === 'free'
              ? 'bg-slate-900 border-cyan-500/80 shadow-xl shadow-cyan-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block mb-2">Freemium</span>
            <div className="text-3xl font-extrabold text-white mb-2">$0 <span className="text-xs text-slate-400 font-normal">/ forever</span></div>
            <p className="text-xs text-slate-400 mb-6">Ideal for individual robotics researchers and university prototyping.</p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>50 Free Policy Compilations / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Local MuJoCo / Colab export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Standard Gemini 3.6 Flash model</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>ROS2 Python & C++ ONNX exporter</span>
              </li>
            </ul>
          </div>

          <button className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all">
            Current Tier
          </button>
        </div>

        {/* Card 2: Simulation API ($100/hr) */}
        <div
          onClick={() => setSelectedPlan('cluster')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative ${
            selectedPlan === 'cluster'
              ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <span className="absolute -top-3 right-6 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </span>

          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">Simulation API</span>
            <div className="text-3xl font-extrabold text-white mb-2">$100 <span className="text-xs text-slate-400 font-normal">/ GPU cluster hour</span></div>
            <p className="text-xs text-slate-400 mb-6">Parallelized Isaac Sim & MuJoCo GPU vectorization cluster.</p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>10,000+ Parallel Sim Envs in GPU memory</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Sub-30s Policy Validation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Full Domain Randomization Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>NVIDIA NIM & Gemini Robotics ER</span>
              </li>
            </ul>
          </div>

          <button className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all">
            Activate Sim Cluster
          </button>
        </div>

        {/* Card 3: Enterprise */}
        <div
          onClick={() => setSelectedPlan('enterprise')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
            selectedPlan === 'enterprise'
              ? 'bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-2">Enterprise Custom</span>
            <div className="text-3xl font-extrabold text-white mb-2">Custom <span className="text-xs text-slate-400 font-normal">/ hardware fleet</span></div>
            <p className="text-xs text-slate-400 mb-6">Dedicated VPC deployment with custom hardware driver bindings.</p>

            <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Custom CAD URDF/MJCF Mesh Parsing</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Dedicated Cloud GPU Instances</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Hardware-in-the-Loop (HIL) Bridge</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>24/7 SLA & Dedicated AI Engineer</span>
              </li>
            </ul>
          </div>

          <button className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all">
            Contact Sales
          </button>
        </div>
      </div>

      {/* Interactive GPU Compute Cost Estimator Calculator */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Simulation Compute Cost Estimator</h3>
            <p className="text-xs text-slate-400">Calculate expected cluster cost for training or validating complex policies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-300 font-semibold">
              <span>Required GPU Cluster Hours</span>
              <span className="text-amber-400 font-mono font-bold">{gpuHours} Hours</span>
            </div>

            <input
              type="range"
              min={1}
              max={100}
              value={gpuHours}
              onChange={(e) => setGpuHours(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-[11px] text-slate-500">
              <span>1 hr (Quick Sim)</span>
              <span>50 hrs (Large RL Batch)</span>
              <span>100 hrs (Full Fleet)</span>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Estimated Total Cost</span>
              <span className="text-3xl font-extrabold text-amber-400">${estimatedTotal.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-1">Includes 10,000 parallel envs + ONNX compilation</span>
            </div>

            <button className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all">
              Pre-purchase GPU Hours
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
