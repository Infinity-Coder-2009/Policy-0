import React, { useRef, useState, useCallback } from 'react';
import { Upload, Video, FileVideo, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { VideoUpload } from '../../types';

interface VideoUploaderProps {
  onUploadComplete: (video: VideoUpload) => void;
  onAnalysisStart: (videoUploadId: string) => void;
  isUploading: boolean;
  uploadedVideo: VideoUpload | null;
  analysisResult: any;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
  onAnalysisStart,
  isUploading,
  uploadedVideo,
  analysisResult,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const allowedTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/avi',
        'video/mov',
      ];

      if (!allowedTypes.includes(file.type)) {
        setError(`Unsupported video format: ${file.type}. Please use MP4, WebM, MOV, or AVI.`);
        return;
      }

      if (file.size > 500 * 1024 * 1024) {
        setError('File too large. Maximum size is 500MB.');
        return;
      }

      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', file);

      try {
        const res = await fetch('/api/upload/video', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload failed');
        }

        const data = await res.json();

        if (data.success && data.video) {
          setUploadProgress(100);
          onUploadComplete(data.video);

          setTimeout(() => {
            onAnalysisStart(data.video.id);
          }, 500);
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (err: any) {
        setError(err?.message || 'Upload failed. Please try again.');
        setUploadProgress(0);
      }
    },
    [onUploadComplete, onAnalysisStart],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
          dragActive
            ? 'border-cyan-500 bg-cyan-500/10'
            : uploadedVideo
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo,video/x-matroska,video/avi,video/mov"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
            <div className="w-full max-w-xs mx-auto bg-slate-900 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">Uploading and preparing for VLM analysis...</p>
          </div>
        ) : uploadedVideo ? (
          <div className="space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <div className="text-sm text-white font-semibold">{uploadedVideo.fileName}</div>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <span>{(uploadedVideo.fileSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
              <span>•</span>
              <span>{uploadedVideo.mimeType}</span>
            </div>
            <p className="text-xs text-emerald-400">Video uploaded — VLM analysis starting...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <FileVideo className="w-10 h-10 text-slate-500 mx-auto" />
            <div>
              <p className="text-sm text-slate-300 font-medium">Drop your task demonstration video here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse — MP4, WebM, MOV, AVI up to 500MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VLM Analysis Result */}
      {analysisResult && (
        <div className="p-5 rounded-xl bg-slate-950/60 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">VLM Analysis Complete</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Task Title</span>
              <span className="text-white font-semibold">{analysisResult.taskTitle}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Robot Type</span>
              <span className="text-white font-semibold capitalize">{analysisResult.robotType}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">DoF</span>
              <span className="text-white font-semibold">{analysisResult.robotDof}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Control Mode</span>
              <span className="text-white font-semibold">{analysisResult.controlMode}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Environment</span>
              <span className="text-white font-semibold">{analysisResult.environment}</span>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 border border-slate-800">
              <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Confidence</span>
              <span className="text-white font-semibold">{(analysisResult.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {analysisResult.keyframes && analysisResult.keyframes.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Keyframes</span>
              <div className="mt-2 space-y-2">
                {analysisResult.keyframes.map((kf: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-xs bg-slate-900/40 rounded-lg p-2.5 border border-slate-800/50">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-white font-medium">{kf.stage}</span>
                      <span className="text-slate-500 ml-2">{kf.timestamp}</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{kf.gripperState}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisResult.simToRealTips && analysisResult.simToRealTips.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Sim-to-Real Tips</span>
              <ul className="mt-2 space-y-1">
                {analysisResult.simToRealTips.map((tip: string, i: number) => (
                  <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-cyan-400 mt-0.5">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};