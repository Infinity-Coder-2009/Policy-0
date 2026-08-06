import React, { useState } from 'react';
import { GeneratedPolicy } from '../../types';
import { X, Copy, Check, Download, Code, Layers, FileCode, Cpu, ShieldCheck, Terminal, ExternalLink } from 'lucide-react';

interface PolicyViewModalProps {
  policy: GeneratedPolicy;
  onClose: () => void;
}

export const PolicyViewModal: React.FC<PolicyViewModalProps> = ({ policy, onClose }) => {
  const [activeTab, setActiveTab] = useState<'python' | 'mujoco' | 'ros2' | 'onnx'>('python');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'python':
        return policy.pythonCode;
      case 'mujoco':
        return policy.mujocoXml;
      case 'ros2':
        return policy.ros2NodeCode;
      case 'onnx':
        return JSON.stringify(
          {
            model_type: policy.routing.planType,
            input_tensor_shape: policy.onnxSpec.inputShape,
            output_tensor_shape: policy.onnxSpec.outputShape,
            mean_inference_latency_ms: policy.onnxSpec.latencyMs,
            file_size_bytes: policy.onnxSpec.fileSizeBytes,
            recommended_runtime: 'ONNXRuntime-TensorRT / CUDA 12.2',
            robot_hardware_target: policy.robot.name,
            sim_to_real_confidence: `${policy.metrics.simToRealConfidencePct}%`,
          },
          null,
          2
        );
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBundle = () => {
    const bundleContent = `=== POLICY-0 DEPLOYMENT BUNDLE ===
Robot: ${policy.robot.name}
Task: ${policy.title}
Created: ${policy.createdAt}

--- 1. PYTHON POLICY SCRIPT ---
${policy.pythonCode}

--- 2. MUJOCO XML SCENE ---
${policy.mujocoXml}

--- 3. ROS2 NODE ---
${policy.ros2NodeCode}
`;

    const blob = new Blob([bundleContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `policy0_${policy.id}_${policy.robot.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-white">{policy.title}</h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono">
                {policy.robot.name}
              </span>
            </div>
            <p className="text-xs text-slate-400">{policy.routing.planType} | Safety Score: {policy.routing.safetyRating}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="px-6 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 py-3">
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'python'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Python Policy (.py)</span>
            </button>

            <button
              onClick={() => setActiveTab('mujoco')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'mujoco'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>MuJoCo Scene (.xml)</span>
            </button>

            <button
              onClick={() => setActiveTab('ros2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'ros2'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>ROS2 Executable Node</span>
            </button>

            <button
              onClick={() => setActiveTab('onnx')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'onnx'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ONNX Graph Spec</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownloadBundle}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Bundle</span>
            </button>
          </div>
        </div>

        {/* Code Content Container */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800/80 overflow-x-auto selection:bg-cyan-500/30">
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
export default PolicyViewModal;
