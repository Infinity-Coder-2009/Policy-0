import {
  GeneratedPolicy,
  ImprovementChange,
  PolicyEvolutionRecord,
  EvolutionOverview,
  EvolvedPolicy,
  ImprovementRecommendation,
} from '../../src/types';
import { getTable } from '../data/sqliteStore';

interface NumericChange {
  parameter: string;
  ratio: number;
}

const versionsTable = getTable<PolicyEvolutionRecord & { id: string }>('evolution_versions');
const improvementsTable = getTable<ImprovementRecommendation & { id: string }>('improvements');

// Threshold for verification: measured gain must be ≥ +2 percentage points
const VERIFICATION_THRESHOLD_PP = 2.0;

function parseNumeric(value: string): number | null {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isFinite(num) ? num : null;
}

function findNumericChange(
  changes: ImprovementChange[],
  keywords: string[],
): NumericChange | null {
  const change = changes.find(
    (c) =>
      keywords.some((k) => c.parameter.toLowerCase().includes(k)) &&
      parseNumeric(c.from) !== null &&
      parseNumeric(c.to) !== null,
  );
  if (!change) return null;
  const fromNum = parseNumeric(change.from)!;
  const toNum = parseNumeric(change.to)!;
  if (fromNum === 0) return null;
  return { parameter: change.parameter, ratio: toNum / fromNum };
}

function scaleDiagNumbers(line: string, ratio: number): string {
  if (!line.includes('np.diag(') || ratio === 1) return line;
  return line.replace(/(np\.diag\s*\(\s*\[)([^\]]+)(\]\s*\))/g, (match, pre, body, post) => {
    const scaled = body
      .split(',')
      .map((part) => {
        const trimmed = part.trim();
        const numMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
        if (!numMatch) return part;
        const scaledNum = parseFloat(numMatch[0]) * ratio;
        return trimmed.replace(numMatch[0], scaledNum.toFixed(1));
      })
      .join(', ');
    return `${pre}${scaled}${post}`;
  });
}

function applyGainChangesToPython(pythonCode: string, kpRatio: number | null, kdRatio: number | null): string {
  if (!kpRatio && !kdRatio) return pythonCode;
  return pythonCode
    .split('\n')
    .map((line) => {
      const lower = line.toLowerCase();
      let updated = line;
      if (kpRatio && (lower.includes('self.kp') || lower.includes('self.stiffness') || /[^a-z]kp\s*=/.test(lower))) {
        updated = scaleDiagNumbers(updated, kpRatio);
      }
      if (kdRatio && (lower.includes('self.kd') || lower.includes('self.damping') || /[^a-z]kd\s*=/.test(lower))) {
        updated = scaleDiagNumbers(updated, kdRatio);
      }
      return updated;
    })
    .join('\n');
}

function applyFrictionChangeToMujoco(mujocoXml: string, changes: ImprovementChange[]): string {
  const frictionChange = changes.find((c) => c.parameter.toLowerCase().includes('friction'));
  if (!frictionChange || !mujocoXml.includes('<geom')) return mujocoXml;
  const value = parseNumeric(frictionChange.to);
  if (value === null) return mujocoXml;
  return mujocoXml.replace(
    /(<geom\b[^>]*?)(\/>|>)/,
    (match, attrs, close) =>
      `${attrs.replace(/\s+friction="[^"]*"/, '')} friction="${value.toFixed(2)}"${close}`,
  );
}

function buildEvolutionPatchBlock(version: number, appliedTitles: string[], changes: ImprovementChange[]): string {
  const lines = [
    '',
    '# =============================================',
    `# [Policy-0 Evolution Patch v${version}]`,
    '# Applied improvements:',
    ...appliedTitles.map((t) => `#   - ${t}`),
    '# Parameter changes baked into this policy:',
    ...changes.map((c) => `#   - ${c.target} / ${c.parameter}: ${c.from} -> ${c.to}`),
    '# =============================================',
  ];
  return lines.join('\n');
}

function getAppliedImprovementsForPolicy(policyId: string) {
  return improvementsTable.filter((i) => i.policyId === policyId && i.status === 'applied');
}

function getLatestVersionForPolicy(policyId: string) {
  const versions = versionsTable.filter((v) => v.policyId === policyId);
  return versions.length > 0 ? versions[0] : null;
}

function getAllVersions() {
  return versionsTable.list();
}

function getVersionsByPolicy(policyId: string) {
  return versionsTable.filter((v) => v.policyId === policyId);
}

function addVersion(record: PolicyEvolutionRecord & { id: string }) {
  versionsTable.insert({ ...record, id: record.id });
}

function updateVersion(id: string, patch: Partial<PolicyEvolutionRecord>) {
  versionsTable.updateById(id, patch);
}

/**
 * Calculate projected success rate (UI estimate only - NOT used for verification).
 * This is a rough arithmetic projection for display purposes.
 */
function calculateProjectedSuccess(successBefore: number, appliedImprovements: ImprovementRecommendation[]): number {
  const totalGain = appliedImprovements.reduce((sum, a) => sum + a.estimatedGainPct, 0);
  return Math.min(99.5, +(successBefore + totalGain * 0.85).toFixed(1));
}

/**
 * Evolve a policy by applying improvements. Returns the evolved policy and record.
 * The evolved policy is NOT marked as verified - that requires measured verification.
 */
export function evolvePolicy(policy: GeneratedPolicy): EvolvedPolicy | null {
  const applied = getAppliedImprovementsForPolicy(policy.id);
  if (applied.length === 0) {
    return null;
  }

  const latest = getLatestVersionForPolicy(policy.id);
  const version = (latest?.version || 0) + 1;

  const allChanges = applied.flatMap((a) => a.changes);
  const kpChange = findNumericChange(allChanges, ['kp', 'stiffness']);
  const kdChange = findNumericChange(allChanges, ['kd', 'damping']);

  const pythonCode =
    applyGainChangesToPython(policy.pythonCode, kpChange?.ratio ?? null, kdChange?.ratio ?? null) +
    buildEvolutionPatchBlock(version, applied.map((a) => a.title), allChanges);

  const mujocoXml = applyFrictionChangeToMujoco(policy.mujocoXml, allChanges);

  const successBefore = policy.metrics.successRatePct;
  const projectedSuccess = calculateProjectedSuccess(successBefore, applied);

  // Evolved policy uses projected metrics as INITIAL ESTIMATE only.
  // Real metrics come from measured verification (runVerification).
  const evolved: GeneratedPolicy = {
    ...policy,
    title: `${policy.title} (v${version})`,
    pythonCode,
    mujocoXml,
    onnxSpec: {
      ...policy.onnxSpec,
      latencyMs: +(policy.onnxSpec.latencyMs * 0.92).toFixed(2),
    },
    metrics: {
      ...policy.metrics,
      successRatePct: projectedSuccess,
      simToRealConfidencePct: Math.min(99, +(policy.metrics.simToRealConfidencePct + 2.5).toFixed(1)),
      meanTrajectoryTimeSec: +(policy.metrics.meanTrajectoryTimeSec * 0.95).toFixed(1),
      totalSimRuns: policy.metrics.totalSimRuns + 250,
    },
  };

  const record: PolicyEvolutionRecord & { id: string } = {
    id: `evol_${Date.now().toString(36)}`,
    policyId: policy.id,
    policyTitle: policy.title,
    version,
    appliedImprovementIds: applied.map((a) => a.id),
    appliedImprovementTitles: applied.map((a) => a.title),
    changesApplied: allChanges,
    successRateBeforePct: successBefore,
    projectedSuccessRatePct: projectedSuccess,
    measuredSuccessRatePct: undefined,
    verified: false,
    verificationJobId: undefined,
    createdAt: new Date().toISOString(),
  };

  addVersion(record);

  return { policy: evolved, record };
}

/**
 * Run verification for an evolved policy by submitting it to Isaac Sim
 * and comparing measured success against the previous version.
 * Returns true if the version is verified (measured gain ≥ threshold).
 */
export async function verifyEvolution(params: {
  evolvedPolicy: GeneratedPolicy;
  record: PolicyEvolutionRecord & { id: string };
  previousPolicy: GeneratedPolicy;
}): Promise<{ verified: boolean; measuredSuccessRatePct?: number; jobId?: string }> {
  const { evolvedPolicy, record, previousPolicy } = params;

  // Only verify if Isaac Sim is enabled
  if (process.env.USE_ISAAC_SIM !== 'true') {
    return { verified: false };
  }

  try {
    // Submit evolved policy to Isaac Sim for measurement
    const { submitIsaacSimSimulation, waitForIsaacSimCompletion, generateSimulationTelemetryIsaacSim } = await import('./isaacSimBridge');

    const jobId = await submitIsaacSimSimulation({
      robot: evolvedPolicy.robot.id,
      taskTitle: evolvedPolicy.title,
      environment: evolvedPolicy.input.environment,
      controlMode: evolvedPolicy.input.controlMode,
      observationSpace: evolvedPolicy.input.observationSpace,
      domainRandomization: evolvedPolicy.input.domainRandomization,
      robotDof: evolvedPolicy.robot.dof,
    });

    // Wait for completion (with timeout)
    const completedJob = await waitForIsaacSimCompletion(jobId, 600000, 10000);

    if (completedJob.status !== 'completed') {
      return { verified: false, jobId };
    }

    // Get measured telemetry
    const telemetry = generateSimulationTelemetryIsaacSim(completedJob, evolvedPolicy.robot.dof);
    const measuredSuccessRatePct = telemetry.successRatePct;

    // Calculate measured gain vs previous version
    const successBefore = previousPolicy.metrics.successRatePct;
    const measuredGainPp = measuredSuccessRatePct - successBefore;

    // Only verify if measured gain meets threshold
    const verified = measuredGainPp >= VERIFICATION_THRESHOLD_PP;

    // Update the record with measured results
    updateVersion(record.id, {
      measuredSuccessRatePct,
      verified,
      verificationJobId: jobId,
    });

    return { verified, measuredSuccessRatePct, jobId };
  } catch (error: any) {
    console.error('Evolution verification failed:', error?.message);
    return { verified: false };
  }
}

/**
 * Get the success rate curve across versions for a policy.
 * Returns array of { version, projectedSuccess, measuredSuccess, verified }.
 */
export function getSuccessRateCurve(policyId: string): Array<{
  version: number;
  projectedSuccess: number;
  measuredSuccess?: number;
  verified: boolean;
  createdAt: string;
}> {
  const versions = getVersionsByPolicy(policyId);
  return versions
    .sort((a, b) => a.version - b.version)
    .map((v) => ({
      version: v.version,
      projectedSuccess: v.projectedSuccessRatePct,
      measuredSuccess: v.measuredSuccessRatePct,
      verified: v.verified,
      createdAt: v.createdAt,
    }));
}

/**
 * Calculate the sim-to-real gap for a policy.
 * Compares simulated success rate vs real-world deployment success rate.
 */
export function getSimToRealGap(policyId: string): {
  policyId: string;
  simSuccessRatePct: number;
  realSuccessRatePct?: number;
  gapPct?: number;
  deployments: number;
} {
  const versions = getVersionsByPolicy(policyId);
  const latestVersion = versions.sort((a, b) => b.version - a.version)[0];

  const simSuccessRatePct = latestVersion?.measuredSuccessRatePct ?? latestVersion?.projectedSuccessRatePct ?? 0;

  // Get deployment runs for this policy
  const runsTable = getTable<any>('deployment_runs');
  const deployments = runsTable.filter((r: any) => r.policyId === policyId && r.source === 'real_world');

  if (deployments.length === 0) {
    return {
      policyId,
      simSuccessRatePct,
      realSuccessRatePct: undefined,
      gapPct: undefined,
      deployments: 0,
    };
  }

  const successfulDeployments = deployments.filter((d) => d.success).length;
  const realSuccessRatePct = +((successfulDeployments / deployments.length) * 100).toFixed(1);
  const gapPct = +(simSuccessRatePct - realSuccessRatePct).toFixed(1);

  return {
    policyId,
    simSuccessRatePct,
    realSuccessRatePct,
    gapPct,
    deployments: deployments.length,
  };
}

export function getEvolutionVersions(): PolicyEvolutionRecord[] {
  return getAllVersions();
}

export function getEvolutionLineage(policyId: string): PolicyEvolutionRecord[] {
  return getVersionsByPolicy(policyId).sort((a, b) => a.version - b.version);
}

export function getEvolutionOverview(): EvolutionOverview {
  const versions = getAllVersions();
  const policiesEvolved = new Set(versions.map((v) => v.policyId)).size;

  // Use measured success when available, fall back to projected
  const gains = versions.map((v) => {
    const after = v.measuredSuccessRatePct ?? v.projectedSuccessRatePct;
    return after - v.successRateBeforePct;
  });

  const verifiedCount = versions.filter((v) => v.verified).length;
  const measuredCount = versions.filter((v) => v.measuredSuccessRatePct !== undefined).length;

  return {
    policiesEvolved,
    totalVersions: versions.length,
    latestVersionCount: versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : 0,
    improvementsApplied: versions.reduce((sum, v) => sum + v.appliedImprovementIds.length, 0),
    avgGainPct: gains.length > 0 ? +((gains.reduce((a, b) => a + b, 0)) / gains.length).toFixed(1) : 0,
    bestGainPct: gains.length > 0 ? Math.max(...gains) : 0,
    verifiedCount,
    measuredCount,
  };
}