export interface RoutingTaskInput {
  title: string;
  description: string;
  robotId: string;
  robotDof: number;
  robotType: string;
  controlMode: string;
  observationSpace: string[];
  domainRandomization: boolean;
}

export interface RoutingResult {
  planType: 'Plan A: Symbolic Trajectory Code' | 'Plan B: Neural VLA Policy (ONNX)' | 'Plan C: Reinforcement Learning (PPO)';
  confidence: number;
  rationale: string;
  estimatedSimTimeSec: number;
  recommendedModel: string;
  safetyRating: 'A+' | 'A' | 'B';
  impedanceBounds: {
    kpTrans: number;
    kpRot: number;
    forceLimitN: number;
  };
}

export function evaluatePolicyRouting(input: RoutingTaskInput): RoutingResult {
  const desc = input.description.toLowerCase();
  const title = input.title.toLowerCase();

  // Heuristic analysis based on robot type and task characteristics
  const isBipedalOrDexterous = input.robotType === 'humanoid' || input.robotType === 'hand' || input.robotDof > 12;
  const isVisualSemantic = input.observationSpace.includes('RGB Camera') || input.observationSpace.includes('Depth Map');
  const needsPrecisionForce = desc.includes('peg') || desc.includes('insert') || desc.includes('screw') || desc.includes('fit') || desc.includes('pour');

  if (isBipedalOrDexterous || desc.includes('walk') || desc.includes('balance') || desc.includes('re-orientation')) {
    return {
      planType: 'Plan C: Reinforcement Learning (PPO)',
      confidence: 0.94,
      rationale: `High Degree-of-Freedom (${input.robotDof}-DoF) ${input.robotType} requires end-to-end multi-contact dynamics optimization via parallelized PPO with GPU vectorization.`,
      estimatedSimTimeSec: 12.8,
      recommendedModel: 'NVIDIA Isaac GPU Vector + PPO',
      safetyRating: 'A',
      impedanceBounds: {
        kpTrans: 300,
        kpRot: 30,
        forceLimitN: 45,
      },
    };
  }

  if (isVisualSemantic && (desc.includes('fold') || desc.includes('pick and place') || desc.includes('drawer') || desc.includes('sort'))) {
    return {
      planType: 'Plan B: Neural VLA Policy (ONNX)',
      confidence: 0.92,
      rationale: `Unstructured visual manipulation task benefits from Vision-Language-Action (VLA) neural policy predicting action chunks directly from camera observation tokens.`,
      estimatedSimTimeSec: 6.5,
      recommendedModel: 'Gemini 3.6 Flash VLA + ONNXRuntime',
      safetyRating: 'A',
      impedanceBounds: {
        kpTrans: 450,
        kpRot: 40,
        forceLimitN: 25,
      },
    };
  }

  // Default: Precision Symbolic Trajectory Generator with Cartesian Compliance
  return {
    planType: 'Plan A: Symbolic Trajectory Code',
    confidence: 0.97,
    rationale: `High-repeatability manipulation with Cartesian impedance control guarantees bounded contact wrenches (${needsPrecisionForce ? '5N-15N' : '10N-30N'}) and low-latency execution.`,
    estimatedSimTimeSec: 3.8,
    recommendedModel: 'Gemini 3.6 Flash Robotics ER',
    safetyRating: 'A+',
    impedanceBounds: {
      kpTrans: 600,
      kpRot: 50,
      forceLimitN: 18,
    },
  };
}
