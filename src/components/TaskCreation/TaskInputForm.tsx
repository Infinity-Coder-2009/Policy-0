import React, { useState } from 'react';
import { ROBOT_MODELS, SAMPLE_VIDEOS } from '../../data/mockData';
import { RobotModel, SampleVideoDemo, TaskInput } from '../../types';
import { Sparkles, Video, Bot, Sliders, Play, CheckCircle2, Upload, AlertCircle, RefreshCw, Wand2, Shield, Eye, Cpu } from 'lucide-react';

interface TaskInputFormProps {
  onGeneratePolicy: (task: TaskInput & { robotName: string; robotDof: number }) => Promise<void>;
  isGenerating: boolean;
  generationStep: string;
}

export const TaskInputForm: React.FC<TaskInputFormProps> = ({ onGeneratePolicy, isGenerating, generationStep }) => {
  const [taskTitle, setTaskTitle] = useState('Pick Red Mug & Place on Top Shelf');
  const [taskDescription, setTaskDescription] = useState(
    'Control robot arm to approach the red ceramic mug, establish a compliant parallel grasp without slipping, lift 20cm vertically, clear the safety obstacle, and place aligned on the top shelf surface.'
  );
  const [selectedRobotId, setSelectedRobotId] = useState('franka_panda');
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>('demo_peg_insert');
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);
  const [environment, setEnvironment] = useState<'MuJoCo' | 'Isaac Sim' | 'Drake' | 'PyBullet'>('MuJoCo');
  const [controlMode, setControlMode] = useState<'Cartesian Impedance' | 'Joint Velocity' | 'Delta EE Pose' | 'Action Chunks'>('Cartesian Impedance');
  const [observationSpace, setObservationSpace] = useState<('RGB Camera' | 'Depth Map' | 'Joint Encoders' | 'EE Force/Torque' | 'Tactile Arrays')[]>(
    ['RGB Camera', 'Joint Encoders', 'EE Force/Torque']
  );
  const [domainRandomization, setDomainRandomization] = useState(true);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedSuccessMsg, setEnhancedSuccessMsg] = useState(false);

  const selectedRobot = ROBOT_MODELS.find((r) => r.id === selectedRobotId) || ROBOT_MODELS[0];
  const selectedVideo = SAMPLE_VIDEOS.find((v) => v.id === selectedVideoId);

  const handleToggleObservation = (modality: 'RGB Camera' | 'Depth Map' | 'Joint Encoders' | 'EE Force/Torque' | 'Tactile Arrays') => {
    if (observationSpace.includes(modality)) {
      if (observationSpace.length > 1) {
        setObservationSpace(observationSpace.filter((m) => m !== modality));
      }
    } else {
      setObservationSpace([...observationSpace, modality]);
    }
  };

  const handleEnhancePrompt = () => {
    setIsEnhancing(true);
    setTimeout(() => {
      setTaskDescription(
        (prev) =>
          `${prev.trim()} [AI Enforced Constraints: Maximum end-effector linear velocity <= 0.25m/s; Maximum gripping force limit <= 18N; Cartesian stiffness Kp_xy=600N/m, Kp_z=400N/m; Safety virtual workspace sphere radius R=0.65m; Force torque sensing active at 1000Hz.]`
      );
      setIsEnhancing(false);
      setEnhancedSuccessMsg(true);
      setTimeout(() => setEnhancedSuccessMsg(false), 3500);
    }, 800);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomVideoName(file.name);
      setSelectedVideoId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGeneratePolicy({
      title: taskTitle,
      description: taskDescription,
      robotId: selectedRobot.id,
      robotName: selectedRobot.name,
      robotDof: selectedRobot.dof,
      environment,
      controlMode,
      observationSpace,
      videoName: customVideoName || selectedVideo?.title || 'None',
      domainRandomization,
      maxExecutionTimeSec: 20,
    });
  };

  return (
    <div className="space-y-8">
      {/* Hero Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Policy Compiler v3.6</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-3">
            Compile Robot Policies from <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">Text & Video</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Provide task instructions or video demonstrations. Policy-0 automatically selects optimal routing (Symbolic Code, Neural VLA, or RL), generates MuJoCo simulation environments, and compiles production-ready ONNX & ROS2 policy packages.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Task Description */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h2 className="text-lg font-semibold text-white">Task Specification</h2>
            </div>
            <button
              type="button"
              id="enhance-prompt-btn"
              onClick={handleEnhancePrompt}
              disabled={isEnhancing}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt with Physics Limits'}</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Task Name / Objective
              </label>
              <input
                id="task-title-input"
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                placeholder="e.g. Insert Peg into Socket, Wipe Table in Spiral Motion, Walk down stairs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Detailed Trajectory & Safety Description
              </label>
              <textarea
                id="task-description-input"
                rows={4}
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600 font-mono text-xs leading-relaxed"
                placeholder="Describe the start pose, target manipulation object, contact mechanics, and velocity bounds..."
              />
              {enhancedSuccessMsg && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Added impedance stiffness bounds & force-torque safety thresholds!</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Video Demonstration Input */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h2 className="text-lg font-semibold text-white">Video Demonstration (Optional)</h2>
            </div>
            <span className="text-xs text-slate-400">Multimodal trajectory extraction</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_VIDEOS.map((video) => {
              const isSelected = selectedVideoId === video.id && !customVideoName;
              return (
                <div
                  key={video.id}
                  id={`video-demo-${video.id}`}
                  onClick={() => {
                    setSelectedVideoId(video.id);
                    setCustomVideoName(null);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex gap-4 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80" />
                    <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white fill-white/80" />
                    </div>
                    <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.5 rounded">
                      {video.duration}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-white truncate">{video.title}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mb-1">{video.description}</p>
                    <span className="text-[10px] text-blue-400 font-mono">{video.robot}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Video File Upload Box */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Or Upload Custom Task Demonstration MP4/MOV
            </label>
            <div className="relative border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center bg-slate-950/40 transition-all">
              <input
                id="video-upload-input"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Video className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              {customVideoName ? (
                <div className="text-xs text-cyan-400 font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selected Video: {customVideoName}</span>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-300 font-medium">Click or Drag video demonstration file here</p>
                  <p className="text-[11px] text-slate-500 mt-1">Supports MP4, WebM, MOV up to 100MB</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Robot Hardware Selection */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h2 className="text-lg font-semibold text-white">Target Robot Hardware</h2>
            </div>
            <span className="text-xs text-slate-400">Kinematic tree & DoF specs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROBOT_MODELS.map((robot) => {
              const isSelected = selectedRobotId === robot.id;
              return (
                <div
                  key={robot.id}
                  id={`robot-select-${robot.id}`}
                  onClick={() => {
                    setSelectedRobotId(robot.id);
                    setControlMode(robot.defaultControlMode as any);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-bold text-white">{robot.name}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>

                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{robot.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80 font-mono text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">DoF</span>
                      <span className="font-bold text-emerald-400">{robot.dof} Joints</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Freq</span>
                      <span className="text-slate-200">{robot.controlFrequencyHz} Hz</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Payload</span>
                      <span className="text-slate-200">{robot.payloadKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Type</span>
                      <span className="text-slate-200 capitalize">{robot.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4: Environment & Policy Execution Settings */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h2 className="text-lg font-semibold text-white">Execution & Simulation Parameters</h2>
            </div>
            <Sliders className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Policy Control Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Cartesian Impedance', 'Joint Velocity', 'Delta EE Pose', 'Action Chunks'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setControlMode(mode)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      controlMode === mode
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Engine */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Simulation Engine
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['MuJoCo', 'Isaac Sim', 'Drake', 'PyBullet'] as const).map((sim) => (
                  <button
                    key={sim}
                    type="button"
                    onClick={() => setEnvironment(sim)}
                    className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      environment === sim
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sim}
                  </button>
                ))}
              </div>
            </div>

            {/* Observation Modalities */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Observation Modalities (Policy Inputs)
              </label>
              <div className="flex flex-wrap gap-2">
                {(['RGB Camera', 'Depth Map', 'Joint Encoders', 'EE Force/Torque', 'Tactile Arrays'] as const).map((modality) => {
                  const active = observationSpace.includes(modality);
                  return (
                    <button
                      key={modality}
                      type="button"
                      onClick={() => handleToggleObservation(modality)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{modality}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Domain Randomization Toggle */}
            <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Domain Randomization (Sim-to-Real Boost)</span>
                  <span className="text-[11px] text-slate-400">Randomizes friction, mass +/-10%, camera extrinsics, and joint motor noise during simulation validation.</span>
                </div>
              </div>
              <input
                id="domain-randomization-toggle"
                type="checkbox"
                checked={domainRandomization}
                onChange={(e) => setDomainRandomization(e.target.checked)}
                className="w-5 h-5 accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Compile Submit Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30 shadow-2xl">
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-white block text-sm">Ready to compile policy</span>
            <span className="text-slate-400">Targeting {selectedRobot.name} in {environment} with Gemini Robotics ER</span>
          </div>

          <button
            id="compile-policy-submit-btn"
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 border border-cyan-300/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-cyan-200" />
                <span>{generationStep || 'Compiling Policy...'}</span>
              </>
            ) : (
              <>
                <Cpu className="w-5 h-5 text-cyan-200" />
                <span>Compile & Validate Policy</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
