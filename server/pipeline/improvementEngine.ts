import { GoogleGenAI, Type } from '@google/genai';
import { callNIMLLMStructured, isNIMLLMAvailable } from '../nimLLM';
import {
  CategorizedFailure,
  ImprovementChange,
  ImprovementRecommendation,
  FailureCategory,
  FlywheelStats,
} from '../../src/types';
import { getTable } from '../data/sqliteStore';

const IMPROVEMENT_TEMPLATES: Record<FailureCategory, {
  title: string;
  changes: ImprovementChange[];
  gain: number;
  priority: ImprovementRecommendation['priority'];
}> = {
  grasp_slip: {
    title: 'Increase grip force & add tactile contact trigger',
    changes: [
      { target: 'Gripper', parameter: 'Grip Force', from: '80% max', to: '100% max (2s hold)' },
      { target: 'State Machine', parameter: 'Lift Trigger', from: 'Timed lift after grasp', to: 'Tactile contact verified before lift' },
      { target: 'Sim-to-Real', parameter: 'Friction Coef', from: '0.8', to: '1.15' },
    ],
    gain: 12,
    priority: 'critical',
  },
  collision_misdetection: {
    title: 'Re-calibrate contact thresholds with signal filtering',
    changes: [
      { target: 'Force Sensor', parameter: 'Contact Threshold', from: '2.0 N', to: '4.5 N' },
      { target: 'Signal Pipeline', parameter: 'Filter', from: 'None', to: 'Median filter (window=5)' },
      { target: 'Sim-to-Real', parameter: 'Noise Sigma', from: '0.01', to: '0.03' },
    ],
    gain: 9,
    priority: 'high',
  },
  stability_oscillation: {
    title: 'Tune impedance gains for stable convergence',
    changes: [
      { target: 'Impedance', parameter: 'Kp', from: '600 N/m', to: '450 N/m' },
      { target: 'Impedance', parameter: 'Kd', from: '2*sqrt(Kp)', to: '2.3*sqrt(Kp)' },
      { target: 'Feedback', parameter: 'EE Velocity Filter', from: 'None', to: 'Low-pass @ 25 Hz' },
    ],
    gain: 14,
    priority: 'high',
  },
  timeout: {
    title: 'Accelerate approach pacing & add watchdog recovery',
    changes: [
      { target: 'Trajectory', parameter: 'Approach Speed', from: '0.05 m/s', to: '0.09 m/s' },
      { target: 'State Machine', parameter: 'Stage Timeout', from: 'None', to: '4s + recover' },
      { target: 'Planner', parameter: 'Execution Budget', from: '20 s', to: '15 s' },
    ],
    gain: 8,
    priority: 'medium',
  },
  target_lost: {
    title: 'Multi-cue tracker with re-acquisition behavior',
    changes: [
      { target: 'Perception', parameter: 'Tracking Cues', from: 'RGB only', to: 'RGB + Depth fusion' },
      { target: 'State Machine', parameter: 'Re-acquire', from: 'None', to: 'Search scan on lost' },
      { target: 'Vision', parameter: 'Confidence Gate', from: '0.5', to: '0.7' },
    ],
    gain: 11,
    priority: 'high',
  },
  contact_jam: {
    title: 'Add compliance dithering during insertion',
    changes: [
      { target: 'Trajectory', parameter: 'Insertion Velocity', from: '0.012 m/s', to: '0.006 m/s' },
      { target: 'Compliance', parameter: 'Search Dither', from: 'None', to: '1 mm sinusoidal' },
      { target: 'Impedance', parameter: 'Lateral Kp', from: '600 N/m', to: '150 N/m' },
    ],
    gain: 15,
    priority: 'critical',
  },
  joint_limit: {
    title: 'Add redundancy resolution with limit safety margin',
    changes: [
      { target: 'IK', parameter: 'Redundancy Resolution', from: 'None', to: 'Null-space projection' },
      { target: 'Constraints', parameter: 'Joint Margin', from: '0%', to: '5% from limits' },
      { target: 'Controller', parameter: 'Limit Clamping', from: 'None', to: 'Smooth clamp + saturate' },
    ],
    gain: 7,
    priority: 'medium',
  },
  navigation_failure: {
    title: 'Inflate obstacle margins & add replan-on-block',
    changes: [
      { target: 'Planner', parameter: 'Obstacle Margin', from: '0.05 m', to: '0.12 m' },
      { target: 'Navigation', parameter: 'Replan Policy', from: 'None', to: 'Replan on stuck' },
      { target: 'Localization', parameter: 'Particle Count', from: '500', to: '2000' },
    ],
    gain: 10,
    priority: 'medium',
  },
  calibration_drift: {
    title: 'Auto zero sensor bias & monitor drift',
    changes: [
      { target: 'Calibration', parameter: 'Auto Zeroing', from: 'None', to: 'Before each run' },
      { target: 'Sensor', parameter: 'Drift Monitor', from: 'None', to: 'Bias alert > 0.5 N' },
      { target: 'Loop', parameter: 'Bias Correction', from: 'None', to: 'Online compensation' },
    ],
    gain: 8,
    priority: 'medium',
  },
  unknown: {
    title: 'Deep telemetry capture for root cause analysis',
    changes: [
      { target: 'Telemetry', parameter: 'Capture Window', from: '5 s', to: '20 s around failure' },
      { target: 'Sensors', parameter: 'Logging Rate', from: '10 Hz', to: '100 Hz' },
      { target: 'Analysis', parameter: 'LLM Review', from: 'None', to: 'Auto Gemini analysis' },
    ],
    gain: 5,
    priority: 'low',
  },
};

const improvementsTable = getTable<ImprovementRecommendation & { id: string }>('improvements');
const failuresTable = getTable<CategorizedFailure & { id: string }>('failures');
const deploymentRunsTable = getTable<{ id: string; outcome: string; policyId: string; failureCategory?: FailureCategory; failureSeverity?: string; rootCause?: string; recommendedAction?: string }>('deployment_runs');

function getAllFailures(): CategorizedFailure[] {
  return failuresTable.list();
}

function getAllImprovements(): ImprovementRecommendation[] {
  return improvementsTable.list();
}

function addImprovements(items: ImprovementRecommendation[]): ImprovementRecommendation[] {
  for (const item of items) {
    improvementsTable.upsert({ ...item, id: item.id });
  }
  return items;
}

function updateImprovement(
  improvementId: string,
  patch: Partial<ImprovementRecommendation>,
): ImprovementRecommendation | null {
  return improvementsTable.updateById(improvementId, patch);
}

function getFlywheelStats(): FlywheelStats {
  const runs = deploymentRunsTable.list();
  const failures = getAllFailures();
  const improvements = getAllImprovements();

  const successRuns = runs.filter((r) => r.outcome === 'success').length;
  const failureRuns = runs.filter((r) => r.outcome === 'failure').length;
  const totalFailures = runs.filter((r) => r.outcome !== 'success').length;
  const categorizedFailures = failures.length;
  const improvementsGenerated = improvements.length;
  const improvementsApplied = improvements.filter((i) => i.status === 'applied').length;

  const categoryCounts = new Map<string, number>();
  for (const f of failures) {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1);
  }
  const topFailureCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category: category as FailureCategory, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalRuns: runs.length,
    successRuns,
    failureRuns,
    passRatePct: runs.length === 0 ? 0 : +((successRuns / runs.length) * 100).toFixed(1),
    totalFailures,
    categorizedFailures,
    uncategorizedFailures: Math.max(0, totalFailures - categorizedFailures),
    improvementsGenerated,
    improvementsApplied,
    topFailureCategories,
  };
}

function buildRecommendation(failure: CategorizedFailure): ImprovementRecommendation {
  const tpl = IMPROVEMENT_TEMPLATES[failure.category];
  const severityBonus =
    failure.severity === 'critical' ? 3 : failure.severity === 'high' ? 2 : failure.severity === 'medium' ? 1 : 0;

  return {
    id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    policyId: failure.policyId,
    policyTitle: failure.taskTitle,
    failureCategory: failure.category,
    title: tpl.title,
    description: `Improvement derived from ${failure.category} failures on "${failure.taskTitle}". ${failure.recommendedAction}`,
    changes: tpl.changes.map((c) => ({ ...c })),
    estimatedGainPct: tpl.gain + severityBonus + Math.floor(Math.random() * 3),
    priority: tpl.priority === 'critical' ? 'critical' : severityBonus >= 2 ? 'high' : tpl.priority,
    status: 'pending',
    createdAt: new Date().toISOString(),
    appliedAt: null,
  };
}

export function generateImprovements(): ImprovementRecommendation[] {
  const failures = getAllFailures();
  const existing = getAllImprovements();
  const existingKeys = new Set(existing.map((i) => `${i.policyId}:${i.failureCategory}`));

  const seen = new Map<string, CategorizedFailure>();
  for (const f of failures) {
    const key = `${f.policyId}:${f.category}`;
    if (!seen.has(key)) {
      seen.set(key, f);
    } else {
      const cur = seen.get(key)!;
      const rank = { low: 1, medium: 2, high: 3, critical: 4 };
      if ((rank[f.severity] || 0) > (rank[cur.severity] || 0)) {
        seen.set(key, f);
      }
    }
  }

  const fresh = Array.from(seen.values())
    .filter((f) => !existingKeys.has(`${f.policyId}:${f.category}`))
    .map(buildRecommendation);

  if (fresh.length > 0) {
    addImprovements(fresh);
  }
  return fresh.length > 0 ? fresh : getAllImprovements();
}

export async function generateImprovementsWithLLM(): Promise<ImprovementRecommendation[]> {
  const failures = getAllFailures();
  if (failures.length === 0) {
    return generateImprovements();
  }

  const improvementSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        policyId: { type: Type.STRING },
        policyTitle: { type: Type.STRING },
        failureCategory: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        estimatedGainPct: { type: Type.NUMBER },
        priority: { type: Type.STRING },
        changes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              target: { type: Type.STRING },
              parameter: { type: Type.STRING },
              from: { type: Type.STRING },
              to: { type: Type.STRING },
            },
            required: ['target', 'parameter', 'from', 'to'],
          },
        },
      },
      required: ['policyId', 'policyTitle', 'failureCategory', 'title', 'description', 'estimatedGainPct', 'priority', 'changes'],
    },
  };

  const failureSummary = failures
    .slice(0, 10)
    .map(
      (f) =>
        `- [${f.category}/${f.severity}] ${f.taskTitle} (${f.robotModel}): ${f.rootCause}`,
    )
    .join('\n');

  const prompt = `You are the Policy-0 Self-Improvement engine. Generate concrete, parameter-level policy improvements based on this real-world failure intelligence.

Failures:
${failureSummary}

For the 3 highest-impact failure categories, output a JSON array of improvement recommendations, each:
1. policyId: best matching policy id from the failures (reuse exactly).
2. policyTitle: task title.
3. failureCategory: exact category name.
4. title: short improvement title.
5. description: why this fixes the failure.
6. estimatedGainPct: expected success-rate gain (integer 3-18).
7. priority: low | medium | high | critical.
8. changes: array of { target, parameter, from, to } objects (2-3 items each).`;

  const useNIMLLM = process.env.USE_NIM_LLM === 'true' && isNIMLLMAvailable();

  if (useNIMLLM) {
    try {
      const parsed = await callNIMLLMStructured<any[]>(
        [{ role: 'user', content: prompt }],
        improvementSchema,
        { temperature: 0.2, model: 'meta/llama-3.1-70b-instruct' }
      );
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validCategories = Object.keys(IMPROVEMENT_TEMPLATES) as FailureCategory[];
        const items: ImprovementRecommendation[] = parsed.map((item: any) => ({
          id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          policyId: item.policyId || 'unknown',
          policyTitle: item.policyTitle || 'Unknown Policy',
          failureCategory: validCategories.includes(item.failureCategory) ? item.failureCategory : 'unknown',
          title: item.title || 'Policy improvement',
          description: item.description || '',
          changes: Array.isArray(item.changes) ? item.changes : [],
          estimatedGainPct: Math.min(18, Math.max(3, Number(item.estimatedGainPct) || 8)),
          priority: ['low', 'medium', 'high', 'critical'].includes(item.priority) ? item.priority : 'medium',
          status: 'pending',
          createdAt: new Date().toISOString(),
          appliedAt: null,
        }));
        addImprovements(items);
        console.log('Improvement Generation: Used NIM LLM (Llama 3.1 70B)');
        return items;
      }
    } catch (nimErr: any) {
      console.warn('NIM LLM improvement generation failed, falling back to Gemini:', nimErr?.message);
    }
  }

  // Fallback to Gemini
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY!,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: improvementSchema,
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validCategories = Object.keys(IMPROVEMENT_TEMPLATES) as FailureCategory[];
      const items: ImprovementRecommendation[] = parsed.map((item: any) => ({
        id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        policyId: item.policyId || 'unknown',
        policyTitle: item.policyTitle || 'Unknown Policy',
        failureCategory: validCategories.includes(item.failureCategory) ? item.failureCategory : 'unknown',
        title: item.title || 'Policy improvement',
        description: item.description || '',
        changes: Array.isArray(item.changes) ? item.changes : [],
        estimatedGainPct: Math.min(18, Math.max(3, Number(item.estimatedGainPct) || 8)),
        priority: ['low', 'medium', 'high', 'critical'].includes(item.priority) ? item.priority : 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
        appliedAt: null,
      }));
      addImprovements(items);
      console.log('Improvement Generation: Used Gemini 3.6 Flash');
      return items;
    }
  } catch (err) {
    console.warn('Gemini improvement generation fallback used:', err);
  }

  return generateImprovements();
}

export function applyImprovement(improvementId: string): ImprovementRecommendation | null {
  return updateImprovement(improvementId, {
    status: 'applied',
    appliedAt: new Date().toISOString(),
  });
}

export function listImprovements(): ImprovementRecommendation[] {
  return getAllImprovements();
}

export function getStats() {
  return getFlywheelStats();
}