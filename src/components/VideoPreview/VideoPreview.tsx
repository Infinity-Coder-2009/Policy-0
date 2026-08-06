import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle2, XCircle, RefreshCw, Loader2, Video, Clock, AlertTriangle } from 'lucide-react';
import { NVIDIAVideoGenResult, ApprovalDecision } from '../../types';

interface VideoPreviewProps {
  videoGenResult: NVIDIAVideoGenResult | null;
  isGenerating: boolean;
  onApprove: (decision: 'approved' | 'rejected' | 'revision_requested', feedback: string) => void;
  approvalStatus: ApprovalDecision | null;
  onGenerateVideo: () => void;
  onReset: () => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoGenResult,
  isGenerating,
  onApprove,
  approvalStatus,
  onGenerateVideo,
  onReset,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    if (videoGenResult?.status === 'complete') {
      setIsPlaying(true);
    }
  }, [videoGenResult]);

  const handleApprove = () => {
    onApprove('approved', '');
  };

  const handleReject = () => {
    onApprove('rejected', 'Video does not accurately represent the task. Needs revision.');
  };

  const handleRevision = () => {
    onApprove('revision_requested', 'Please adjust the video generation parameters and retry.');
  };

  return (
    <div className="space-y-6">
      {/* Video Generation Status */}
      {isGenerating && !videoGenResult && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm text-white font-semibold">Generating 4K Robot Simulation Video</p>
            <p className="text-xs text-slate-400 mt-1">Powered by NVIDIA Omniverse / Isaac Sim</p>
          </div>
          <div className="w-full max-w-xs bg-slate-900 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      )}

      {/* Video Player */}
      {videoGenResult && videoGenResult.status === 'complete' && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950">
              {/* Simulated video player placeholder */}
              <div className="text-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto border border-cyan-500/30 cursor-pointer hover:bg-cyan-500/30 transition-all"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-cyan-400 fill-cyan-400" />
                  ) : (
                    <Play className="w-8 h-8 text-cyan-400 fill-cyan-400 ml-1" />
                  )}
                </div>
                <p className="text-xs text-slate-400">4K Simulation Video — NVIDIA Omniverse</p>
              </div>
            </div>

            {/* Hover controls overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-all cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                </button>
              </div>
            </div>

            {/* Video info overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-white/70">
              <div className="flex items-center gap-2">
                <Video className="w-3 h-3" />
                <span>{videoGenResult.resolution}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{videoGenResult.durationSec}s</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live</span>
              </div>
            </div>
          </div>

          {/* Approval Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 flex-1">
              <Video className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-300">Review the generated simulation video</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                onClick={handleRevision}
                className="px-4 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Request Revision
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve & Compile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Generation Failed */}
      {videoGenResult && videoGenResult.status === 'failed' && (
        <div className="p-5 rounded-xl bg-red-500/5 border border-red-500/20 text-center space-y-3">
          <XCircle className="w-10 h-10 text-red-400 mx-auto" />
          <p className="text-sm text-red-300 font-semibold">Video Generation Failed</p>
          <p className="text-xs text-slate-400">{videoGenResult.errorMessage || 'Unknown error'}</p>
          <button
            onClick={onGenerateVideo}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 text-xs font-semibold transition-all cursor-pointer"
          >
            Retry Video Generation
          </button>
        </div>
      )}

      {/* Approval Status */}
      {approvalStatus && (
        <div className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
          approvalStatus.decision === 'approved'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : approvalStatus.decision === 'rejected'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {approvalStatus.decision === 'approved' && <CheckCircle2 className="w-4 h-4" />}
          {approvalStatus.decision === 'rejected' && <XCircle className="w-4 h-4" />}
          {approvalStatus.decision === 'revision_requested' && <AlertTriangle className="w-4 h-4" />}
          <span className="font-semibold capitalize">{approvalStatus.decision.replace('_', ' ')}</span>
          {approvalStatus.feedback && <span className="text-slate-400">— {approvalStatus.feedback}</span>}
        </div>
      )}

      {/* Reset Button */}
      {(videoGenResult || approvalStatus) && (
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          Start New Task
        </button>
      )}
    </div>
  );
};