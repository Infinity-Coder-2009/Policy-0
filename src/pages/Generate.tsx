/**
 * Policy Generation Workflow Page
 * ============================================================
 * Multi-step wizard: Task Input → VLM Analysis → Generation → Simulation → Export
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Cpu,
  Play,
  Download,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../lib/api';
import { Button, Input, Select, Card, Badge } from '../components/ui';
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

export function GeneratePage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [currentStep, setCurrentStep] = useState<Step>('input');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    robotId: 'franka_panda',
    robotDof: 7,
    controlMode: 'Cartesian Impedance',
    environment: 'MuJoCo',
    domainRandomization: false,
    observationSpace: ['RGB Camera', 'Joint Encoders'],
  });
  const [generatedPolicy, setGeneratedPolicy] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: () =>
      api.post<{ success: boolean; policy: any }>('/api/policy/generate', formData),
    onSuccess: (data) => {
      setGeneratedPolicy(data.policy);
      setCurrentStep('export');
      addToast({ type: 'success', message: 'Policy generated successfully!' });
    },
    onError: (err: any) => {
      addToast({ type: 'error', message: err.message || 'Generation failed' });
    },
  });

  const handleGenerate = () => {
    setCurrentStep('generation');
    generateMutation.mutate();
  };

  const goToStep = (step: Step) => {
    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    if (stepIndex <= currentIndex) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Policy</h1>
        <p className="text-[#A0A0B8] mt-1">Create a new robot policy from task description</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted =
            STEPS.findIndex((s) => s.id === currentStep) > index;
          return (
            <button
              key={step.id}
              onClick={() => goToStep(step.id as Step)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-[#0055FF]/10 text-[#0055FF] border border-[#0055FF]/30'
                  : isCompleted
                  ? 'bg-[#00CC88]/10 text-[#00CC88] border border-[#00CC88]/30'
                  : 'bg-[#141428] text-[#A0A0B8] border border-[#2A2A4A]'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <step.icon className="w-4 h-4" />
              )}
              {step.label}
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        {currentStep === 'input' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Task Description</h2>
            <Input
              label="Policy Title"
              placeholder="e.g., Pick and Place Red Cube"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#E8E8F0]">
                Task Description
              </label>
              <textarea
                className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#A0A0B8] focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]/50 transition-all min-h-[120px]"
                placeholder="Describe the robot task in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Robot"
                options={ROBOT_OPTIONS}
                value={formData.robotId}
                onChange={(e) => setFormData({ ...formData, robotId: e.target.value })}
              />
              <Select
                label="Control Mode"
                options={CONTROL_MODES}
                value={formData.controlMode}
                onChange={(e) => setFormData({ ...formData, controlMode: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="domain-randomization"
                checked={formData.domainRandomization}
                onChange={(e) => setFormData({ ...formData, domainRandomization: e.target.checked })}
                className="rounded border-[#2A2A4A] bg-[#0A0A1A]"
              />
              <label htmlFor="domain-randomization" className="text-sm text-[#E8E8F0]">
                Enable domain randomization
              </label>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep('analysis')}>
                Analyze Task
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'analysis' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">VLM Analysis Result</h2>
            <div className="p-4 rounded-xl bg-[#0A0A1A] border border-[#2A2A4A]">
              <pre className="text-sm text-[#E8E8F0] whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    taskTitle: formData.title || 'Untitled Task',
                    taskDescription: formData.description,
                    robotType: 'arm',
                    robotDof: formData.robotDof,
                    controlMode: formData.controlMode,
                    observationSpace: formData.observationSpace,
                    environment: formData.environment,
                    keyframes: [
                      { stage: 'APPROACH', description: 'Move towards object' },
                      { stage: 'GRASP', description: 'Close gripper on object' },
                      { stage: 'LIFT', description: 'Lift object to target height' },
                      { stage: 'PLACE', description: 'Move to placement location' },
                      { stage: 'RELEASE', description: 'Open gripper' },
                    ],
                  },
                  null,
                  2
                )}
              </pre>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentStep('input')}>
                Back
              </Button>
              <Button onClick={handleGenerate}>Generate Policy</Button>
            </div>
          </div>
        )}

        {currentStep === 'generation' && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-[#0055FF] animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">Generating Policy</h2>
            <p className="text-[#A0A0B8]">Running routing, policy synthesis, and simulation...</p>
            <div className="mt-6 max-w-md mx-auto">
              <div className="h-2 bg-[#141428] rounded-full overflow-hidden">
                <div className="h-full bg-[#0055FF] rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'simulation' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Simulation Preview</h2>
            <div className="aspect-video bg-[#0A0A1A] rounded-xl flex items-center justify-center border border-[#2A2A4A]">
              <div className="text-center">
                <Play className="w-12 h-12 text-[#A0A0B8] mx-auto mb-2" />
                <p className="text-[#A0A0B8]">Simulation video will appear here</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 rounded-xl bg-[#0A0A1A] text-center">
                <p className="text-2xl font-bold text-white">94.5%</p>
                <p className="text-xs text-[#A0A0B8]">Success Rate</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A1A] text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-[#A0A0B8]">Collisions</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A1A] text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-[#A0A0B8]">Falls</p>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A1A] text-center">
                <p className="text-2xl font-bold text-white">142J</p>
                <p className="text-xs text-[#A0A0B8]">Energy</p>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => setCurrentStep('generation')}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep('export')}>Export</Button>
            </div>
          </div>
        )}

        {currentStep === 'export' && generatedPolicy && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-[#00CC88]" />
              <div>
                <h2 className="text-lg font-semibold text-white">Policy Generated!</h2>
                <p className="text-sm text-[#A0A0B8]">ID: {generatedPolicy.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                ONNX
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                Python
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                ROS2
              </Button>
              <Button variant="secondary" size="sm">
                <Download className="w-4 h-4" />
                LEAPP
              </Button>
            </div>

            <div className="flex justify-between">
              <Button variant="secondary" onClick={() => navigate('/policies')}>
                View All Policies
              </Button>
              <Button onClick={() => setCurrentStep('input')}>
                Generate Another
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}