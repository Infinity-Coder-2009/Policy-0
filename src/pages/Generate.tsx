/**
 * Policy Generation Workflow Page
 * ============================================================
 * Multi-step wizard: Task Input → VLM Analysis → Generation → Simulation → Export
 * Supports all 3 policy generation methods:
 * - Plan A: Symbolic Trajectory Code
 * - Plan B: Neural VLA Policy (ONNX)
 * - Plan C: Reinforcement Learning (PPO)
 */

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  Cpu,
  Play,
  Download,
  CheckCircle2,
  Loader2,
  X,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Button, Input, Select, Card, Badge, Skeleton } from '../components/ui';
import { useUIStore } from '../stores/uiStore';

type Step = 'input' | 'analysis' | 'generation' | 'simulation' | 'export';

const STEPS = [
  { id: 'input', label: 'Task Input', icon: FileText },
  { id: 'analysis', label: 'VLM Analysis', icon: Cpu },
  { id: 'generation', label: 'Generation', icon: Loader2 },
  { id: 'simulation', label: 'Simulation', icon: Play },
  { id: 'export', label: 'Export', icon: Download },
];

const ROBOT_OPTIONS = [
  { value: 'franka_panda', label: 'Franka Emika Panda' },
  { value: 'ur5e', label: 'Universal Robots UR5e' },
  { value: 'kinova_gen3', label: 'Kinova Gen3' },
  { value: 'unitree_h1', label: 'Unitree H1' },
];

const CONTROL_MODES = [
  { value: 'Cartesian Impedance', label: 'Cartesian Impedance' },
  { value: 'Joint Velocity', label: 'Joint Velocity' },
  { value: 'Delta EE Pose', label: 'Delta EE Pose' },
  { value: 'Action Chunks', label: 'Action Chunks' },
];

const ENVIRONMENT_OPTIONS = [
  { value: 'MuJoCo', label: 'MuJoCo (Fast)' },
  { value: 'Isaac Sim', label: 'NVIDIA Isaac Sim (Realistic)' },
  { value: 'PyBullet', label: 'PyBullet (Flexible)' },
];

interface VLMAnalysisResult {
  id: string;
  taskTitle: string;
  taskDescription: string;
  robotType: string;
  robotDof: number;
  controlMode: string;
  observationSpace: string[];
  environment: string;
  keyframes: Array<{
    stage: string;
    timestamp: string;
    gripperState: string;
    actionDescription: string;
  }>;
  obstacleConstraints: string[];
  recommendedControlMode: string;
  simToRealTips: string[];
  confidence: number;
  analyzedAt: string;
}

interface GeneratedPolicy {
  id: string;
  title: string;
  description: string;
  routing: {
    planType: 'Plan A: Symbolic Trajectory Code' | 'Plan B: Neural VLA Policy (ONNX)' | 'Plan C: Reinforcement Learning (PPO)';
    confidence: number;
    rationale: string;
    estimatedSimTimeSec: number;
    recommendedModel: string;
    safetyRating: 'A+' | 'A' | 'B';
  };
  status: 'queued' | 'analyzing' | 'generating' | 'simulating' | 'validated' | 'failed';
  pythonCode: string;
  mujocoXml: string;
  ros2NodeCode: string;
  onnxSpec: {
    inputShape: string;
    outputShape: string;
    latencyMs: number;
    fileSizeBytes: number;
  };
  metrics: {
    successRatePct: number;
    meanTrajectoryTimeSec: number;
    simToRealConfidencePct: number;
    energyScoreJoule: number;
  };
  telemetry: any[];
  mode: 'SIMULATED' | 'REAL';
  simJobId?: string | null;
  simJobStatus?: string | null;
  createdAt: string;
}

export function GeneratePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useUIStore();
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [vlmAnalysis, setVlmAnalysis] = useState<VLMAnalysisResult | null>(null);
  const [generatedPolicy, setGeneratedPolicy] = useState<GeneratedPolicy | null>(null);

  // Auto-start at analysis step if URL has task parameter
  useEffect(() => {
    const taskParam = searchParams.get('task');
    if (taskParam && currentStep === 'input') {
      setFormData(prev => ({ ...prev, description: taskParam }));
      setCurrentStep('analysis');
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    robotId: 'franka_panda',
    robotDof: 7,
    controlMode: 'Cartesian Impedance',
    environment: 'MuJoCo',
    domainRandomization: true,
    observationSpace: ['RGB Camera', 'Joint Encoders'] as string[],
  });

  // VLM Analysis Mutation
  const analyzeMutation = useMutation({
    mutationFn: async (description: string) => {
      const result = await api.post<VLMAnalysisResult>('/api/policy/analyze-description', { description });
      return result;
    },
    onSuccess: (data) => {
      setVlmAnalysis(data);
      setCurrentStep('generation');
    },
    onError: (err: any) => {
      addToast({ type: 'error', message: err.message || 'Analysis failed' });
    },
  });

  // Policy Generation Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const result = await api.post<{ success: boolean; policy: GeneratedPolicy }>('/api/policy/generate', formData);
      return result;
    },
    onSuccess: (data) => {
      setGeneratedPolicy(data.policy);
      setCurrentStep('export');
      addToast({ type: 'success', message: `Policy generated successfully! (${data.policy.routing.planType})` });
    },
    onError: (err: any) => {
      if (err instanceof ApiError && err.status === 429) {
        addToast({ type: 'warning', message: 'Rate limit hit. The policy is being generated asynchronously. Check back in a few moments.' });
      } else {
        addToast({ type: 'error', message: err.message || 'Generation failed' });
      }
    },
  });

  const handleAnalyze = () => {
    if (!formData.description && !formData.title) {
      addToast({ type: 'error', message: 'Please enter a task description' });
      return;
    }
    analyzeMutation.mutate(formData.description || formData.title);
  };

  const handleGenerate = () => {
    setCurrentStep('generation');
    generateMutation.mutate();
  };

  const handleGenerateFromAnalysis = () => {
    if (vlmAnalysis) {
      // Use VLM analysis results to pre-fill and generate
      setFormData(prev => ({
        ...prev,
        title: vlmAnalysis.taskTitle,
        description: vlmAnalysis.taskDescription,
        robotDof: vlmAnalysis.robotDof,
        controlMode: vlmAnalysis.recommendedControlMode as any,
        environment: vlmAnalysis.environment as any,
        observationSpace: vlmAnalysis.observationSpace,
      }));
      generateMutation.mutate();
    } else {
      generateMutation.mutate();
    }
  };

  const goToStep = (step: Step) => {
    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex <= currentIndex) {
      setCurrentStep(step);
    }
  };

  const getPlanIcon = (planType: string) => {
    if (planType.includes('Symbolic')) return '💡';
    if (planType.includes('Neural')) return '🧠';
    if (planType.includes('Reinforcement')) return '🎯';
    return '⚙️';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Policy</h1>
        <p className="text-[#A0A0B8] mt-1">Create a new robot policy from task description</p>
      </div>

      {/* Plan Type Info Banner */}
      {!generatedPolicy && !analyzeMutation.isLoading && (
        <Card className="bg-gradient-to-r from-[#0055FF]/10 to-[#0088FF]/5 border border-[#0055FF]/30">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Photon-0 Policy Generation</h3>
              <p className="text-[#A0A0B8] mb-3">
                Policies are automatically routed to the optimal generation method:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-[#141428] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💡</span>
                    <strong>Plan A</strong>
                  </div>
                  <p className="text-[#A0A0B8]">Symbolic Trajectory Code - For precise, repeatable tasks</p>
                </div>
                <div className="bg-[#141428] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🧠</span>
                    <strong>Plan B</strong>
                  </div>
                  <p className="text-[#A0A0B8]">Neural VLA Policy (ONNX) - For vision-based manipulation</p>
                </div>
                <div className="bg-[#141428] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <strong>Plan C</strong>
                  </div>
                  <p className="text-[#A0A0B8]">Reinforcement Learning (PPO) - For complex locomotion</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const analysisComplete = vlmAnalysis && step.id === 'analysis';
          const isCompleted =
            STEPS.findIndex((s) => s.id === currentStep) > index || analysisComplete;
          return (
            <button
              key={step.id}
              onClick={() => goToStep(step.id as Step)}
              disabled={!isCompleted}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0055FF]/10 text-[#0055FF] border border-[#0055FF]/30 shadow-lg'
                  : isCompleted
                  ? 'bg-[#00CC88]/10 text-[#00CC88] border border-[#00CC88]/30'
                  : 'bg-[#141428] text-[#A0A0B8] border border-[#2A2A4A] cursor-not-allowed opacity-50'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isActive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="min-h-[400px]">
        {currentStep === 'input' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0055FF]" />
              Task Description
            </h2>

            <div className="space-y-4">
              <Input
                label="Policy Title"
                placeholder="e.g., Pick and Place Red Cube"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#E8E8F0]">
                  Task Description <span className="text-[#FF3355]">*</span>
                </label>
                <textarea
                  className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]/50 transition-all min-h-[120px]"
                  placeholder="Describe the robot task in detail. Be as specific as possible about the object, environment, and desired outcome..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select
                    label="Robot"
                    options={ROBOT_OPTIONS}
                    value={formData.robotId}
                    onChange={(e) => setFormData({ ...formData, robotId: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Select
                    label="Control Mode"
                    options={CONTROL_MODES}
                    value={formData.controlMode}
                    onChange={(e) => setFormData({ ...formData, controlMode: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Select
                  label="Environment"
                  options={ENVIRONMENT_OPTIONS}
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                />
                <p className="text-xs text-[#A0A0B8]">
                  MuJoCo is fastest for development, Isaac Sim provides photorealistic physics
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141428]/50 border border-[#2A2A4A]">
                <input
                  type="checkbox"
                  id="domain-randomization"
                  checked={formData.domainRandomization}
                  onChange={(e) => setFormData({ ...formData, domainRandomization: e.target.checked })}
                  className="rounded border-[#2A2A4A] bg-[#0A0A1A] w-4 h-4"
                />
                <div>
                  <label htmlFor="domain-randomization" className="text-sm text-[#E8E8F0] font-medium">
                    Enable domain randomization
                  </label>
                  <p className="text-xs text-[#A0A0B8]">Helps policy generalize to real-world variations</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleAnalyze} disabled={analyzeMutation.isLoading}>
                {analyzeMutation.isLoading ? 'Analyzing...' : 'Analyze Task'}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-[#0055FF]" />
                VLM Analysis Result
              </h2>
              {vlmAnalysis && (
                <Badge variant="info">Confidence: {Math.round(vlmAnalysis.confidence * 100)}%</Badge>
              )}
            </div>

            {analyzeMutation.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-10" />
              </div>
            ) : vlmAnalysis ? (
              <>
                <div className="bg-[#0A0A1A]/50 rounded-xl p-4 border border-[#2A2A4A] font-mono text-xs">
                  <pre className="text-[#E8E8F0] whitespace-pre-wrap overflow-x-auto">
{JSON.stringify(vlmAnalysis, null, 2)}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-[#0055FF]/10 border border-[#0055FF]/20">
                    <p className="text-xs text-[#A0A0B8] uppercase">Recommended Control</p>
                    <p className="text-sm font-medium text-white mt-1">{vlmAnalysis.recommendedControlMode}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#00CC88]/10 border border-[#00CC88]/20">
                    <p className="text-xs text-[#A0A0B8] uppercase">Environment</p>
                    <p className="text-sm font-medium text-white mt-1">{vlmAnalysis.environment}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20">
                    <p className="text-xs text-[#A0A0B8] uppercase">Observation Space</p>
                    <p className="text-sm font-medium text-white mt-1">{vlmAnalysis.observationSpace.length} modalities</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="secondary" onClick={() => setCurrentStep('input')}>
                    Back
                  </Button>
                  <div className="gap-2 flex flex-col sm:flex-row sm:gap-2">
                    <Button onClick={handleGenerateFromAnalysis} disabled={generateMutation.isLoading}>
                      Generate with Analysis
                    </Button>
                    <Button variant="secondary" onClick={() => {
                      if (vlmAnalysis) {
                        setFormData({
                          ...formData,
                          title: vlmAnalysis.taskTitle,
                          description: vlmAnalysis.taskDescription,
                          robotDof: vlmAnalysis.robotDof,
                          controlMode: vlmAnalysis.recommendedControlMode as any,
                          environment: vlmAnalysis.environment as any,
                          observationSpace: vlmAnalysis.observationSpace,
                        });
                        setCurrentStep('input');
                      }
                    }}>
                      Edit and Generate
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <X className="w-12 h-12 text-[#FF3355] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Analysis Failed</h3>
                <p className="text-[#A0A0B8]">Please check your task description and try again</p>
                <Button variant="secondary" className="mt-4" onClick={() => setCurrentStep('input')}>
                  Go Back
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'generation' && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0055FF]/10 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#0055FF] animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-white">Generating Policy</h2>
            </div>

            <p className="text-[#A0A0B8] max-w-2xl mx-auto">
              Running the complete policy generation pipeline: routing decision, code synthesis, simulation, and optimization.
              This may take a few moments...
            </p>

            <div className="max-w-md mx-auto">
              <div className="bg-[#141428] rounded-full h-2 overflow-hidden mb-4">
                <div className="h-full bg-gradient-to-r from-[#0055FF] to-[#0088FF] rounded-full animate-pulse" style={{ width: generateMutation.isLoading ? '70%' : '30%' }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className={`p-3 rounded-lg ${generateMutation.isLoading || !generateMutation.isError ? 'bg-[#141428]/30' : 'bg-[#FF3355]/10'}`}>
                <span className="block mb-1">📊 Routing</span>
                {generateMutation.isLoading ? 'Evaluating...' : 'Complete'}
              </div>
              <div className={`p-3 rounded-lg ${generateMutation.isLoading || !generateMutation.isError ? 'bg-[#141428]/30' : 'bg-[#FF3355]/10'}`}>
                <span className="block mb-1">💻 Code Synthesis</span>
                {generateMutation.isLoading ? 'Generating...' : 'Complete'}
              </div>
              <div className={`p-3 rounded-lg ${generateMutation.isLoading || !generateMutation.isError ? 'bg-[#141428]/30' : 'bg-[#FF3355]/10'}`}>
                <span className="block mb-1">🎮 Simulation</span>
                {generateMutation.isLoading ? 'Running...' : 'Complete'}
              </div>
            </div>

            {generateMutation.isError && (
              <div className="bg-[#FF3355]/10 border border-[#FF3355]/30 rounded-xl p-4">
                <p className="text-[#FF3355] font-medium">Generation failed</p>
                <p className="text-sm text-[#A0A0B8] mt-1">{generateMutation.error?.message || 'Unknown error'}</p>
                <Button variant="secondary" size="sm" className="mt-2" onClick={() => setCurrentStep('input')}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'simulation' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-[#00CC88]" />
              Simulation Preview
            </h2>

            <div className="aspect-video bg-[#0A0A1A] rounded-xl flex items-center justify-center border border-[#2A2A4A] overflow-hidden">
              {generatedPolicy?.simJobStatus === 'running' ? (
                <div className="text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-[#0055FF] animate-spin mx-auto" />
                  <p className="text-[#A0A0B8]">Isaac Sim simulation running...</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#2A2A4A]/30 flex items-center justify-center mx-auto mb-3">
                    🎥
                  </div>
                  <p className="text-[#A0A0B8]">Simulation video will appear here</p>
                  <p className="text-xs text-[#A0A0B8] mt-1">
                    {generatedPolicy?.mode === 'REAL' ? 'From Isaac Sim' : 'Simulated'}
                  </p>
                </div>
              )}
            </div>

            {generatedPolicy && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-xl bg-[#141428] text-center">
                    <p className="text-2xl font-bold text-[#00CC88]">
                      {generatedPolicy.metrics.successRatePct.toFixed(1)}%
                    </p>
                    <p className="text-xs text-[#A0A0B8]">Success Rate</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141428] text-center">
                    <p className="text-2xl font-bold text-[#FFB800]">
                      {generatedPolicy.metrics.meanTrajectoryTimeSec.toFixed(1)}s
                    </p>
                    <p className="text-xs text-[#A0A0B8]">Avg Time</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141428] text-center">
                    <p className="text-2xl font-bold text-[#00CC88]">
                      {generatedPolicy.telemetry?.length || 0}
                    </p>
                    <p className="text-xs text-[#A0A0B8]">Steps</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#141428] text-center">
                    <p className="text-2xl font-bold text-white">
                      {generatedPolicy.metrics.energyScoreJoule.toFixed(0)}J
                    </p>
                    <p className="text-xs text-[#A0A0B8]">Energy</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00CC88]/10 border border-[#00CC88]/30 text-sm">
                  <Badge variant="success" className="text-xs">
                    {generatedPolicy.mode === 'REAL' ? 'Real Isaac Sim Data' : 'Simulated Data'}
                  </Badge>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4">
              <Button variant="secondary" onClick={() => setCurrentStep('generation')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('export')}>Continue to Export</Button>
            </div>
          </div>
        )}

        {currentStep === 'export' && generatedPolicy && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#00CC88]" />
              <div>
                <h2 className="text-lg font-semibold text-white">Policy Generated!</h2>
                <p className="text-sm text-[#A0A0B8]">ID: <code className="bg-[#141428] px-2 py-1 rounded">{generatedPolicy.id}</code></p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#00CC88]/10 border border-[#00CC88]/30">
              <span className="text-2xl">
                {generatedPolicy.routing.planType.includes('Symbolic') ? '💡' :
                 generatedPolicy.routing.planType.includes('Neural') ? '🧠' : '🎯'}
              </span>
              <div>
                <p className="text-sm font-medium text-white">
                  {generatedPolicy.routing.planType}
                </p>
                <p className="text-xs text-[#A0A0B8]">{generatedPolicy.routing.rationale}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#141428] text-center">
                <Download className="w-6 h-6 text-[#0055FF] mx-auto mb-2" />
                <p className="text-sm font-medium text-white">ONNX</p>
                <p className="text-xs text-[#A0A0B8]">Neural Network Export</p>
              </div>
              <div className="p-4 rounded-xl bg-[#141428] text-center">
                <Download className="w-6 h-6 text-[#0088FF] mx-auto mb-2" />
                <p className="text-sm font-medium text-white">Python</p>
                <p className="text-xs text-[#A0A0B8]">Executable Code</p>
              </div>
              <div className="p-4 rounded-xl bg-[#141428] text-center">
                <Download className="w-6 h-6 text-[#FFB800] mx-auto mb-2" />
                <p className="text-sm font-medium text-white">ROS2</p>
                <p className="text-xs text-[#A0A0B8]">Robot Deployment</p>
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <Button variant="secondary" onClick={() => navigate('/policies')}>
                View All Policies
              </Button>
              <div className="gap-2 flex flex-col sm:flex-row sm:gap-2">
                <Button variant="secondary" onClick={() => setCurrentStep('input')}>
                  Generate Another
                </Button>
                <Button onClick={() => window.print?.()}>
                  Export PDF Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}