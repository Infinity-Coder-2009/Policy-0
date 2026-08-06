import { GoogleGenAI, Type } from '@google/genai';
import { DeploymentRun, CategorizedFailure, FailureCategory, ErrorSignal } from '../../src/types';

export const FAILURE_TAXONOMY: Array<{ category: FailureCategory; label: string; keywords: string[] }> = [
  { category: 'grasp_slip', label: 'Grasp Slip', keywords: ['slip', 'dropped', 'slide', 'tactile', 'grip loss'] },
  { category: 'collision_misdetection', label: 'Collision Mis-detection', keywords: ['collision', 'contact spike', 'false trigger', 'impact', 'bump'] },
  { category: 'stability_oscillation', label: 'Stability Oscillation', keywords: ['oscillat', 'vibrat', 'shak', 'unstable', 'overshoot', 'jitter'] },
  { category: 'timeout', label: 'Execution Timeout', keywords: ['timeout', 'slow', 'exceeded time', 'stuck', 'stalled'] },
  { category: 'target_lost', label: 'Target Lost', keywords: ['tracking lost', 'target lost', 'vision', 'occluded', 'no detection'] },
  { category: 'contact_jam', label: 'Contact Jam / Wedge', keywords: ['jam', 'wedge', 'stuck insertion', 'bind', 'seized'] },
  { category: 'joint_limit', label: 'Joint Limit Reached', keywords: ['joint limit', 'singularity', 'limit', 'out of range'] },
  { category: 'navigation_failure', label: 'Navigation Failure', keywords: ['navigation', 'path blocked', 'localization', 'goal unreachable', 'lidar'] },
  { category: 'calibration_drift', label: 'Calibration Drift', keywords: ['calibration', 'drift', 'bias', 'offset', 'force sensor'] },
  { category: 'unknown', label: 'Unknown Failure', keywords: [] },
];

const SEVERITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

export function classifySeverity(run: DeploymentRun): CategorizedFailure['severity'] {
  if (!run.errorSignals || run.errorSignals.length === 0) return 'medium';
  const worst = run.errorSignals.reduce((acc, s) =>
    SEVERITY_RANK[s.severity] > SEVERITY_RANK[acc] ? s.severity : acc,
    'low' as CategorizedFailure['severity'],
  );
  if (run.successScore < 30) {
    return SEVERITY_RANK[worst] >= 3 ? 'critical' : 'high';
  }
  return worst;
}

export function categorizeFailureRuleBased(run: DeploymentRun): CategorizedFailure {
  const signals = run.errorSignals || [];
  const signalText = signals.map((s) => `${s.type} ${s.description}`).join(' ').toLowerCase();
  const signalTypes = signals.map((s) => s.type.toLowerCase()).join(' ');

  let category: FailureCategory = 'unknown';
  let score = 0;
  let matched: { category: FailureCategory; label: string; keywords: string[] } | null = null;

  for (const entry of FAILURE_TAXONOMY) {
    let entryScore = 0;
    for (const kw of entry.keywords) {
      if (signalText.includes(kw) || signalTypes.includes(kw)) {
        entryScore += 1;
      }
    }
    if (entryScore > score) {
      score = entryScore;
      category = entry.category;
      matched = entry;
    }
  }

  const categoryDef = matched || FAILURE_TAXONOMY[FAILURE_TAXONOMY.length - 1];
  const confidence = category === 'unknown' ? 0.35 : Math.min(0.95, 0.6 + score * 0.1);

  const rootCauseByCategory: Record<FailureCategory, string> = {
    grasp_slip: 'Insufficient grasp force or improper contact surface / friction model mismatch.',
    collision_misdetection: 'Contact threshold mis-calibrated; obstacle sensor latency or false positives.',
    stability_oscillation: 'Impedance gains (Kp/Kd) too aggressive relative to payload dynamics.',
    timeout: 'Trajectory pacing too slow or state machine stuck waiting for a transition condition.',
    target_lost: 'Vision tracking lost due to occlusion, lighting change, or object drift out of FOV.',
    contact_jam: 'Insertion velocity too high with rigid alignment; no compliance search motion.',
    joint_limit: 'Desired pose unreachable or command exceeds joint range / near singularity.',
    navigation_failure: 'Path planning failed or localization drift caused goal unreachable.',
    calibration_drift: 'Sensor bias accumulated over run causing systematic control error.',
    unknown: 'No dominant failure signature detected; requires LLM deep analysis.',
  };

  const actionByCategory: Record<FailureCategory, string> = {
    grasp_slip: 'Increase grip force 20%, add tactile contact trigger before lift, raise friction coefficient in sim-to-real.',
    collision_misdetection: 'Re-calibrate contact threshold, add median filter on force signal, validate with domain-randomized trials.',
    stability_oscillation: 'Reduce Kp by 25%, raise Kd 10%, add low-pass filter on EE velocity feedback.',
    timeout: 'Speed up approach phase 15%, add timeout watchdog with recover action.',
    target_lost: 'Add multi-cue tracker (depth + RGB), implement re-acquire behavior on lost signal.',
    contact_jam: 'Add 1mm sinusoidal search dithering during insertion and lower insertion velocity.',
    joint_limit: 'Add IK redundancy resolution, clamp targets with 5% safety margin from limits.',
    navigation_failure: 'Retrain path planner with inflated obstacle margins, add replan-on-block logic.',
    calibration_drift: 'Add periodic auto-bias zeroing at start of each run and drift monitor.',
    unknown: 'Collect longer failure window and run LLM-assisted root cause analysis.',
  };

  return {
    id: `fail_${Date.now().toString(36)}`,
    runId: run.id,
    policyId: run.policyId,
    taskTitle: run.taskTitle,
    robotModel: run.robotModel,
    category,
    severity: classifySeverity(run),
    description: `Automatic classification of run ${run.id}: ${categoryDef.label}. Signals: ${signalText || 'none recorded'}.`,
    rootCause: rootCauseByCategory[category],
    recommendedAction: actionByCategory[category],
    confidence: +confidence.toFixed(2),
    classifiedAt: new Date().toISOString(),
    classifier: 'rules',
  };
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function categorizeFailureWithLLM(run: DeploymentRun): Promise<CategorizedFailure> {
  const ai = getGeminiClient();

  const signalSummary = (run.errorSignals || [])
    .map((s) => `- [${s.severity}] ${s.type} at t=${s.occurredAtSec}s: ${s.description}`)
    .join('\n');

  const prompt = `You are the Policy-0 Failure Intelligence engine. A deployed robot policy failed in the real world (or high-fidelity simulation). Analyze the anonymous run telemetry and classify the failure.

Policy: "${run.taskTitle}"
Robot: ${run.robotModel}
Outcome score: ${run.successScore}/100, duration ${run.durationSec}s, attempts ${run.numAttempts}

Error signals captured:
${signalSummary || '- no explicit signals'}

Classify the failure into exactly one category from this taxonomy:
1. grasp_slip - object slipped from gripper
2. collision_misdetection - contact/obstacle mis-handled
3. stability_oscillation - controller oscillating/unstable
4. timeout - task exceeded execution window
5. target_lost - vision/tracking lost target
6. contact_jam - object wedged during insertion/assembly
7. joint_limit - command hit joint limits/singularity
8. navigation_failure - mobile base failed to reach goal
9. calibration_drift - sensor drift/bias degraded control
10. unknown - cannot determine

Output a JSON object:
1. category: one of the exact category names above.
2. severity: low | medium | high | critical.
3. description: 1-2 sentence concise failure summary.
4. rootCause: 1-2 sentence root cause hypothesis.
5. recommendedAction: concrete actionable fix for the policy (gains, thresholds, architecture).
6. confidence: number 0.0-1.0.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          severity: { type: Type.STRING },
          description: { type: Type.STRING },
          rootCause: { type: Type.STRING },
          recommendedAction: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ['category', 'severity', 'description', 'rootCause', 'recommendedAction', 'confidence'],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');

  const validCategories: FailureCategory[] = FAILURE_TAXONOMY.map((t) => t.category);
  const category = validCategories.includes(parsed.category) ? parsed.category : 'unknown';
  const severity = ['low', 'medium', 'high', 'critical'].includes(parsed.severity) ? parsed.severity : 'medium';

  return {
    id: `fail_${Date.now().toString(36)}`,
    runId: run.id,
    policyId: run.policyId,
    taskTitle: run.taskTitle,
    robotModel: run.robotModel,
    category,
    severity,
    description: parsed.description || categorizeFailureRuleBased(run).description,
    rootCause: parsed.rootCause || 'Unknown',
    recommendedAction: parsed.recommendedAction || 'Requires manual review.',
    confidence: typeof parsed.confidence === 'number' ? +parsed.confidence.toFixed(2) : 0.7,
    classifiedAt: new Date().toISOString(),
    classifier: 'llm',
  };
}

export function highestSeveritySignal(run: DeploymentRun): ErrorSignal | null {
  if (!run.errorSignals || run.errorSignals.length === 0) return null;
  return run.errorSignals.reduce((acc, s) =>
    SEVERITY_RANK[s.severity] > SEVERITY_RANK[acc.severity] ? s : acc,
  );
}
