import crypto from 'crypto';
import { DeploymentRun, ErrorSignal, CategorizedFailure, FlywheelStats, FailureCategory } from '../../src/types';
import { getTable } from '../data/sqliteStore';
import { categorizeFailureRuleBased, categorizeFailureWithLLM } from './failureCategorizer';

export interface CollectRunPayload {
  policyId: string;
  robotModel?: string;
  taskTitle?: string;
  outcome: 'success' | 'failure' | 'partial';
  successScore?: number;
  durationSec?: number;
  numAttempts?: number;
  errorSignals?: ErrorSignal[];
  environmentFingerprint?: string;
  source?: 'sim' | 'real_world';
  deviceSerial?: string;
}

const deploymentRunsTable = getTable<DeploymentRun & { id: string }>('deployment_runs');
const failuresTable = getTable<CategorizedFailure & { id: string }>('failures');

function anonymizeEnvironment(fingerprint: string | undefined, deviceSerial: string | undefined): string {
  if (deviceSerial) {
    return crypto.createHash('sha256').update(deviceSerial).digest('hex').substring(0, 16);
  }
  if (fingerprint) {
    return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 16);
  }
  return crypto.createHash('sha256').update(String(Math.random())).digest('hex').substring(0, 16);
}

function getAllRuns(): DeploymentRun[] {
  return deploymentRunsTable.list();
}

function addRun(run: DeploymentRun): DeploymentRun {
  deploymentRunsTable.upsert({ ...run, id: run.id });
  return run;
}

function addFailure(failure: CategorizedFailure): CategorizedFailure {
  failuresTable.upsert({ ...failure, id: failure.id });
  return failure;
}

export function collectDeploymentRun(payload: CollectRunPayload): DeploymentRun {
  const run: DeploymentRun = {
    id: `run_${Date.now().toString(36)}`,
    policyId: payload.policyId || 'unknown',
    robotModel: payload.robotModel || 'unknown',
    taskTitle: payload.taskTitle || 'Untitled Deployment',
    outcome: payload.outcome,
    successScore: payload.successScore ?? (payload.outcome === 'success' ? 100 : payload.outcome === 'partial' ? 60 : 15),
    durationSec: payload.durationSec || 0,
    numAttempts: payload.numAttempts || 1,
    errorSignals: Array.isArray(payload.errorSignals) ? payload.errorSignals : [],
    environmentFingerprint: anonymizeEnvironment(payload.environmentFingerprint, payload.deviceSerial),
    deployedAt: new Date().toISOString(),
    source: payload.source || 'sim',
  };

  addRun(run);

  if (run.outcome !== 'success') {
    const classified = categorizeFailureRuleBased(run);
    addFailure(classified);
  }

  return run;
}

export async function upgradeFailureClassificationWithLLM(runId: string): Promise<any> {
  const run = getAllRuns().find((r) => r.id === runId);
  if (!run) {
    throw new Error(`Deployment run not found: ${runId}`);
  }
  try {
    const classified = await categorizeFailureWithLLM(run);
    return addFailure(classified);
  } catch (err) {
    console.warn('LLM classification fallback used:', err);
    const classified = categorizeFailureRuleBased(run);
    return addFailure(classified);
  }
}

export async function simulateDeploymentRun(policy: {
  id: string;
  title: string;
  robotName: string;
  metrics: { successRatePct: number };
  input: { robotId?: string };
}): Promise<DeploymentRun> {
  const baseSuccess = policy.metrics?.successRatePct ?? 90;
  const roll = Math.random() * 100;

  let outcome: DeploymentRun['outcome'];
  let successScore: number;

  if (roll <= baseSuccess * 0.9) {
    outcome = 'success';
    successScore = 88 + Math.random() * 12;
  } else if (roll <= baseSuccess) {
    outcome = 'partial';
    successScore = 55 + Math.random() * 20;
  } else {
    outcome = 'failure';
    successScore = 10 + Math.random() * 25;
  }

  const failurePool: Array<Partial<ErrorSignal> & { pick: number }> = [
    { pick: 0.32, type: 'grasp_slip', severity: 'high', description: 'Object slid out of gripper during lift', occurredAtSec: 1.4 },
    { pick: 0.24, type: 'contact_jam', severity: 'high', description: 'Insertion wedge detected, excessive contact force', occurredAtSec: 2.6 },
    { pick: 0.18, type: 'stability_oscillation', severity: 'medium', description: 'End-effector oscillation near target, no convergence', occurredAtSec: 3.1 },
    { pick: 0.14, type: 'target_lost', severity: 'medium', description: 'Vision tracking lost target after occlusion', occurredAtSec: 1.1 },
    { pick: 0.12, type: 'collision_misdetection', severity: 'critical', description: 'False collision trigger aborted task', occurredAtSec: 2.2 },
  ];

  const errorSignals: ErrorSignal[] = [];
  if (outcome !== 'success') {
    let r = Math.random();
    let picked: any = failurePool[0];
    for (const cand of failurePool) {
      if (r < cand.pick) {
        picked = cand;
        break;
      }
      r -= cand.pick;
    }
    errorSignals.push({
      type: picked.type,
      severity: picked.severity,
      description: picked.description,
      occurredAtSec: picked.occurredAtSec,
    });
  }

  return collectDeploymentRun({
    policyId: policy.id,
    robotModel: policy.robotName,
    taskTitle: policy.title,
    outcome,
    successScore,
    durationSec: +(3.0 + Math.random() * 9.0).toFixed(1),
    numAttempts: outcome === 'failure' ? 1 + Math.floor(Math.random() * 2) : 1,
    errorSignals,
    source: Math.random() > 0.5 ? 'real_world' : 'sim',
  });
}

export function getUncategorizedFailuresForCollector() {
  const runs = getAllRuns();
  const failures = failuresTable.list();
  const classifiedRunIds = new Set(failures.map((f) => f.runId));
  return runs.filter((r) => r.outcome !== 'success' && !classifiedRunIds.has(r.id));
}

function getFlywheelStats(): FlywheelStats {
  const runs = getAllRuns();
  const failures = failuresTable.list();

  const successRuns = runs.filter((r) => r.outcome === 'success').length;
  const failureRuns = runs.filter((r) => r.outcome === 'failure').length;
  const totalFailures = runs.filter((r) => r.outcome !== 'success').length;
  const categorizedFailures = failures.length;

  const categoryCounts = new Map<FailureCategory, number>();
  for (const f of failures) {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1);
  }
  const topFailureCategories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
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
    improvementsGenerated: 0,
    improvementsApplied: 0,
    topFailureCategories,
  };
}

export function getDataMoatStats() {
  return getFlywheelStats();
}