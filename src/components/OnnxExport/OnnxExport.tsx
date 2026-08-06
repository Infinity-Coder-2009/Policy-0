import React, { useState } from 'react';
import { Download, FileCode, ShieldCheck, Clock, Weight, Zap, CheckCircle2, Loader2, Copy, ExternalLink } from 'lucide-react';
import { OnnxExportResult, GeneratedPolicy } from '../../types';

interface OnnxExportProps {
  policy: GeneratedPolicy;
  onnxExport: OnnxExportResult | null;
  isExporting: boolean;
  onExport: () => void;
}

export const OnnxExport: React.FC<OnnxExportProps> = ({ policy, onnxExport, isExporting, onExport }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    if (!onnxExport) return;

    fetch(`/api/policy/onnx-download/${onnxExport.onnxModelUrl.split('/').pop()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = onnxExport.onnxModelUrl.split('/').pop() || 'policy.onnx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Download error:', err);
      });
  };

  const handleCopyPython = () => {
    navigator.clipboard.writeText(policy.pythonCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyRos2 = () => {
    navigator.clipboard.writeText(policy.ros2NodeCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyMujoco = () => {
    navigator.clipboard.writeText(policy.mujocoXml || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Export Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Policy Export</h3>
          <p className="text-xs text-slate-400 mt-1">Download your compiled policy in multiple formats</p>
        </div>
        <button
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              Export ONNX
            </>
          )}
        </button>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="text-xs text-slate-300">Building ONNX model from policy spec...</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse" style={{ width: '75%' }} />
          </div>
        </div>
      )}

      {/* ONNX Export Result */}
      {onnxExport && (
        <div className="p-5 rounded-xl bg-slate-950/60 border border-emerald-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">ONNX Export Complete</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 text-center">
              <FileCode className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">Format</span>
              <span className="text-xs text-white font-semibold">{onnxExport.exportFormat.toUpperCase()}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 text-center">
              <Weight className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">Size</span>
              <span className="text-xs text-white font-semibold">{(onnxExport.onnxModelSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 text-center">
              <Zap className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">Latency</span>
              <span className="text-xs text-white font-semibold">{onnxExport.latencyMs} ms</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800 text-center">
              <ShieldCheck className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <span className="text-[10px] text-slate-500 block">Opset</span>
              <span className="text-xs text-white font-semibold">v{onnxExport.opsetVersion}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
              <span className="text-[10px] text-slate-500 block mb-1">ONNX Input Shape</span>
              <code className="text-xs text-cyan-300 font-mono">{onnxExport.inputShape}</code>
            </div>
            <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-800/50">
              <span className="text-[10px] text-slate-500 block mb-1">ONNX Output Shape</span>
              <code className="text-xs text-cyan-300 font-mono">{onnxExport.outputShape}</code>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download ONNX Model
            </button>
            <button
              onClick={() => window.open(onnxExport.onnxModelUrl, '_blank')}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View
            </button>
          </div>
        </div>
      )}

      {/* Exportable Artifacts */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exportable Artifacts</h4>

        {/* Python Code */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-300">Python Policy Script</span>
            </div>
            <button
              onClick={handleCopyPython}
              className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48">
            {policy.pythonCode || '// No Python code generated yet'}
          </pre>
        </div>

        {/* ROS2 Node */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-300">ROS2 Node (Python)</span>
            </div>
            <button
              onClick={handleCopyRos2}
              className="text-[10px] text-slate-500 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48">
            {policy.ros2NodeCode || '// No ROS2 node generated yet'}
          </pre>
        </div>

        {/* MuJoCo XML */}
        <div className="rounded-xl bg-slate-950/60 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-300">MuJoCo XML Scene</span>
            </div>
            <button
              onClick={handleCopyMujoco}
              className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="p-4 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-48">
            {policy.mujocoXml || '// No MuJoCo XML generated yet'}
          </pre>
        </div>
      </div>
    </div>
  );
};