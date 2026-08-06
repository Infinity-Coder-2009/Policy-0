import path from 'path';
import fs from 'fs';
import { DeploymentRun, CategorizedFailure, ImprovementRecommendation, FlywheelStats, FailureCategory, PolicyEvolutionRecord } from '../../src/types';

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'moat-data.json');

interface MoatData {
  runs: DeploymentRun[];
  failures: CategorizedFailure[];
  improvements: ImprovementRecommendation[];
  versions: PolicyEvolutionRecord[];
}

function emptyData(): MoatData {
  return { runs: [], failures: [], improvements: [], versions: [] };
}

function ensureFile(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(emptyData(), null, 2), 'utf-8');
  }
}

function readData(): MoatData {
  ensureFile();
  try {
    const raw = fs.readFileSync(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      failures: Array.isArray(parsed.failures) ? parsed.failures : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      versions: Array.isArray(parsed.versions) ? parsed.versions : [],
    };
  } catch (err) {
    console.warn('Data store read failed, resetting:', err);
    const data = emptyData();
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
    return data;
  }
}

function writeData(data: MoatData): void {
  ensureFile();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

export function getAllRuns(): DeploymentRun[] {
  return readData().runs;
}

export function getRunById(runId: string): DeploymentRun | null {
  return readData().runs.find((r) => r.id === runId) || null;
}

export function addRun(run: DeploymentRun): DeploymentRun {
  const data = readData();
  data.runs.unshift(run);
  writeData(data);
  return run;
}

export function getAllFailures(): CategorizedFailure[] {
  return readData().failures;
}

export function getFailureByRunId(runId: string): CategorizedFailure | null {
  return readData().failures.find((f) => f.runId === runId) || null;
}

export function addFailure(failure: CategorizedFailure): CategorizedFailure {
  const data = readData();
  const existing = data.failures.findIndex((f) => f.runId === failure.runId);
  if (existing >= 0) {
    data.failures[existing] = failure;
  } else {
    data.failures.unshift(failure);
  }
  writeData(data);
  return failure;
}

export function getUncategorizedFailures(): DeploymentRun[] {
  const data = readData();
  const classifiedRunIds = new Set(data.failures.map((f) => f.runId));
  return data.runs.filter((r) => r.outcome !== 'success' && !classifiedRunIds.has(r.id));
}

export function getAllImprovements(): ImprovementRecommendation[] {
  return readData().improvements;
}

export function addImprovements(items: ImprovementRecommendation[]): ImprovementRecommendation[] {
  const data = readData();
  data.improvements.unshift(...items);
  writeData(data);
  return items;
}

export function updateImprovement(
  improvementId: string,
  patch: Partial<ImprovementRecommendation>,
): ImprovementRecommendation | null {
  const data = readData();
  const idx = data.improvements.findIndex((i) => i.id === improvementId);
  if (idx < 0) return null;
  data.improvements[idx] = { ...data.improvements[idx], ...patch };
  writeData(data);
  return data.improvements[idx];
}

export function getFlywheelStats(): FlywheelStats {
  const data = readData();
  const runs = data.runs;
  const successRuns = runs.filter((r) => r.outcome === 'success').length;
  const failureRuns = runs.filter((r) => r.outcome === 'failure').length;
  const totalFailures = runs.filter((r) => r.outcome !== 'success').length;
  const categorizedFailures = data.failures.length;
  const improvementsGenerated = data.improvements.length;
  const improvementsApplied = data.improvements.filter((i) => i.status === 'applied').length;

  const categoryCounts = new Map<string, number>();
  for (const f of data.failures) {
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

// ===== Phase 3: Policy Evolution Versions =====

export function addVersion(record: PolicyEvolutionRecord): PolicyEvolutionRecord {
  const data = readData();
  data.versions.unshift(record);
  writeData(data);
  return record;
}

export function getAllVersions(): PolicyEvolutionRecord[] {
  return readData().versions;
}

export function getVersionsByPolicy(policyId: string): PolicyEvolutionRecord[] {
  return readData().versions.filter((v) => v.policyId === policyId);
}

export function getAppliedImprovementsForPolicy(policyId: string): ImprovementRecommendation[] {
  return readData().improvements.filter((i) => i.policyId === policyId && i.status === 'applied');
}

export function getLatestVersionForPolicy(policyId: string): PolicyEvolutionRecord | null {
  const versions = getVersionsByPolicy(policyId);
  return versions.length > 0 ? versions[0] : null;
}
