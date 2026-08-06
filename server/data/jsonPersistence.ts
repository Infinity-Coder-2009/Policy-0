/**
 * JSON-backed Persistence Implementation
 * ============================================================
 * Wraps the existing sqliteStore (JSON files) to implement the
 * Persistence interface. Used when DATA_BACKEND=json (default).
 */

import path from 'path';
import fs from 'fs';
import { createHash } from 'crypto';
import { getTable, transaction } from './sqliteStore';
import type {
  Persistence,
  PersistenceUser,
  PersistenceRefreshToken,
  PersistenceApiKey,
  PersistenceOrganization,
  PersistenceRobot,
  PersistencePolicy,
  PersistencePolicyVersion,
  PersistenceDeploymentRun,
  PersistenceCategorizedFailure,
  PersistenceImprovementRecommendation,
  PersistenceNvJob,
} from './persistence';

// Re-export the table getter for backward compatibility
export { getTable } from './sqliteStore';

const dataDir = path.join(process.cwd(), 'data');

function readJson<T>(fileName: string): T[] {
  const f = path.join(dataDir, fileName);
  if (!fs.existsSync(f)) return [];
  try {
    const raw = fs.readFileSync(f, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeJson(fileName: string, rows: any[]): void {
  const f = path.join(dataDir, fileName);
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf-8');
  fs.renameSync(tmp, f);
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  return typeof value === 'string' ? new Date(value) : value;
}

function mapUser(row: any): PersistenceUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    name: row.name,
    createdAt: toDate(row.createdAt)!,
    updatedAt: toDate(row.updatedAt)!,
    organizationId: row.organizationId ?? null,
  };
}

function mapRefreshToken(row: any): PersistenceRefreshToken {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    userId: row.userId,
    createdAt: toDate(row.createdAt)!,
    expiresAt: toDate(row.expiresAt)!,
  };
}

function mapApiKey(row: any): PersistenceApiKey {
  return {
    id: row.id,
    keyHash: row.keyHash,
    name: row.name,
    userId: row.userId,
    lastUsed: toDate(row.lastUsed),
    createdAt: toDate(row.createdAt)!,
    expiresAt: toDate(row.expiresAt),
  };
}

function mapPolicy(row: any): PersistencePolicy {
  return {
    id: row.id,
    policy: row.policy,
    mode: row.mode,
    createdAt: toDate(row.createdAt)!,
    updatedAt: toDate(row.updatedAt)!,
  };
}

function mapPolicyVersion(row: any): PersistencePolicyVersion {
  return {
    id: row.id,
    policyId: row.policyId,
    version: row.version,
    policyJson: row.policy,
    verified: row.verified,
    createdAt: toDate(row.createdAt)!,
  };
}

export class JsonPersistence implements Persistence {
  constructor() {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  // ===== Users =====
  async findUserByEmail(email: string): Promise<PersistenceUser | null> {
    const table = getTable<any>('users');
    const found = table.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return found ? mapUser(found) : null;
  }

  async findUserById(id: string): Promise<PersistenceUser | null> {
    const table = getTable<any>('users');
    const found = table.find((u) => u.id === id);
    return found ? mapUser(found) : null;
  }

  async createUser(input: { email: string; passwordHash: string; role: PersistenceUser['role']; name?: string }): Promise<PersistenceUser> {
    const table = getTable<any>('users');
    const user = {
      id: `usr_${Date.now().toString(36)}`,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
      name: input.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      organizationId: null,
    };
    table.insert(user);
    return mapUser(user);
  }

  async listUsers(): Promise<PersistenceUser[]> {
    const table = getTable<any>('users');
    return table.list().map(mapUser);
  }

  async countUsers(): Promise<number> {
    const table = getTable<any>('users');
    return table.count();
  }

  // ===== Refresh Tokens =====
  async storeRefreshToken(record: { token: string; userId: string; createdAt: string; expiresAt: string }): Promise<PersistenceRefreshToken> {
    const table = getTable<any>('refresh_tokens');
    const stored = {
      id: `rt_${Date.now().toString(36)}`,
      tokenHash: sha256(record.token),
      userId: record.userId,
      createdAt: record.createdAt,
      expiresAt: record.expiresAt,
    };
    table.insert(stored);
    // prune expired
    const now = Date.now();
    table.del((t) => new Date(t.expiresAt).getTime() < now);
    return mapRefreshToken(stored);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const table = getTable<any>('refresh_tokens');
    const hash = sha256(token);
    table.del((t) => t.tokenHash === hash);
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    const table = getTable<any>('refresh_tokens');
    table.del((t) => t.userId === userId);
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    const table = getTable<any>('refresh_tokens');
    const hash = sha256(token);
    const found = table.find((t) => t.tokenHash === hash);
    if (!found) return false;
    return new Date(found.expiresAt).getTime() > Date.now();
  }

  // ===== API Keys =====
  async findApiKeyByHash(keyHash: string): Promise<PersistenceApiKey | null> {
    const table = getTable<any>('api_keys');
    const found = table.find((k) => k.keyHash === keyHash);
    return found ? mapApiKey(found) : null;
  }

  async createApiKey(input: { keyHash: string; name: string; userId: string; expiresAt?: Date }): Promise<PersistenceApiKey> {
    const table = getTable<any>('api_keys');
    const key = {
      id: `ak_${Date.now().toString(36)}`,
      keyHash: input.keyHash,
      name: input.name,
      userId: input.userId,
      createdAt: new Date().toISOString(),
      expiresAt: input.expiresAt?.toISOString(),
      lastUsed: null,
    };
    table.insert(key);
    return mapApiKey(key);
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    const table = getTable<any>('api_keys');
    table.updateById(id, { lastUsed: new Date().toISOString() });
  }

  async listApiKeysByUser(userId: string): Promise<PersistenceApiKey[]> {
    const table = getTable<any>('api_keys');
    return table.filter((k) => k.userId === userId).map(mapApiKey);
  }

  async revokeApiKey(id: string): Promise<void> {
    const table = getTable<any>('api_keys');
    table.delById(id);
  }

  // ===== Policies =====
  async savePolicy(policy: any, mode: 'SIMULATED' | 'REAL'): Promise<PersistencePolicy> {
    const table = getTable<any>('policies');
    const now = new Date().toISOString();
    const existing = table.find((p) => p.id === policy.id);
    const record = existing
      ? { ...existing, policy, mode, updatedAt: now }
      : { id: policy.id, policy, mode, createdAt: now, updatedAt: now };
    table.upsert(record);
    return mapPolicy(record);
  }

  async getPolicy(id: string): Promise<PersistencePolicy | null> {
    const table = getTable<any>('policies');
    const found = table.find((p) => p.id === id);
    return found ? mapPolicy(found) : null;
  }

  async listPolicies(): Promise<PersistencePolicy[]> {
    const table = getTable<any>('policies');
    return table.list().map(mapPolicy);
  }

  async deletePolicy(id: string): Promise<boolean> {
    const policiesTable = getTable<any>('policies');
    const versionsTable = getTable<any>('policy_versions');
    policiesTable.delById(id);
    versionsTable.del((v) => v.policyId === id);
    return true;
  }

  async countPolicies(): Promise<number> {
    const table = getTable<any>('policies');
    return table.count();
  }

  // ===== Policy Versions =====
  async savePolicyVersion(policy: any, version: number, verified: boolean): Promise<PersistencePolicyVersion> {
    const table = getTable<any>('policy_versions');
    const record = {
      id: `pver_${Date.now().toString(36)}`,
      policyId: policy.id,
      version,
      policy,
      verified,
      createdAt: new Date().toISOString(),
    };
    table.insert(record);
    return mapPolicyVersion(record);
  }

  async listPolicyVersions(policyId: string): Promise<PersistencePolicyVersion[]> {
    const table = getTable<any>('policy_versions');
    return table.filter((v) => v.policyId === policyId).map(mapPolicyVersion);
  }

  async latestPolicyVersion(policyId: string): Promise<PersistencePolicyVersion | null> {
    const versions = await this.listPolicyVersions(policyId);
    return versions.length > 0 ? versions[0] : null;
  }

  async markVersionVerified(policyId: string, version: number): Promise<PersistencePolicyVersion | null> {
    const table = getTable<any>('policy_versions');
    const versions = table.filter((v) => v.policyId === policyId);
    for (const v of versions) {
      if (v.version === version) {
        table.updateById(v.id, { verified: true });
        const updated = table.find((x) => x.id === v.id);
        return updated ? mapPolicyVersion(updated) : null;
      }
    }
    return null;
  }

  async allPolicyVersions(): Promise<PersistencePolicyVersion[]> {
    const table = getTable<any>('policy_versions');
    return table.list().map(mapPolicyVersion);
  }

  // ===== Deployment Runs =====
  async createDeploymentRun(input: { policyVersionId: string; source: PersistenceDeploymentRun['source'] }): Promise<PersistenceDeploymentRun> {
    const table = getTable<any>('deployment_runs');
    const record = {
      id: `run_${Date.now().toString(36)}`,
      policyVersionId: input.policyVersionId,
      source: input.source,
      status: 'PENDING',
      startedAt: new Date().toISOString(),
    };
    table.insert(record);
    return {
      id: record.id,
      policyVersionId: record.policyVersionId,
      source: record.source as PersistenceDeploymentRun['source'],
      status: record.status as PersistenceDeploymentRun['status'],
      startedAt: new Date(record.startedAt),
    };
  }

  async updateDeploymentRun(id: string, patch: Partial<PersistenceDeploymentRun>): Promise<PersistenceDeploymentRun | null> {
    const table = getTable<any>('deployment_runs');
    const updateData: any = {};
    if (patch.status) updateData.status = patch.status;
    if (patch.success !== undefined) updateData.success = patch.success;
    if (patch.metrics) updateData.metrics = patch.metrics;
    if (patch.error) updateData.error = patch.error;
    if (patch.completedAt) updateData.completedAt = patch.completedAt.toISOString();
    const updated = table.updateById(id, updateData);
    return updated ? {
      id: updated.id,
      policyVersionId: updated.policyVersionId,
      source: updated.source,
      status: updated.status,
      success: updated.success,
      metrics: updated.metrics,
      error: updated.error,
      startedAt: new Date(updated.startedAt),
      completedAt: updated.completedAt ? new Date(updated.completedAt) : null,
    } : null;
  }

  async getDeploymentRun(id: string): Promise<PersistenceDeploymentRun | null> {
    const table = getTable<any>('deployment_runs');
    const found = table.find((r) => r.id === id);
    if (!found) return null;
    return {
      id: found.id,
      policyVersionId: found.policyVersionId,
      source: found.source,
      status: found.status,
      success: found.success,
      metrics: found.metrics,
      error: found.error,
      startedAt: new Date(found.startedAt),
      completedAt: found.completedAt ? new Date(found.completedAt) : null,
    };
  }

  async listDeploymentRuns(policyVersionId?: string): Promise<PersistenceDeploymentRun[]> {
    const table = getTable<any>('deployment_runs');
    const runs = policyVersionId
      ? table.filter((r) => r.policyVersionId === policyVersionId)
      : table.list();
    return runs.map((r) => ({
      id: r.id,
      policyVersionId: r.policyVersionId,
      source: r.source,
      status: r.status,
      success: r.success,
      metrics: r.metrics,
      error: r.error,
      startedAt: new Date(r.startedAt),
      completedAt: r.completedAt ? new Date(r.completedAt) : null,
    }));
  }

  // ===== Categorized Failures =====
  async createCategorizedFailure(input: Omit<PersistenceCategorizedFailure, 'id' | 'firstSeenAt' | 'lastSeenAt'>): Promise<PersistenceCategorizedFailure> {
    const table = getTable<any>('categorized_failures');
    const now = new Date().toISOString();
    const record = {
      id: `fail_${Date.now().toString(36)}`,
      ...input,
      firstSeenAt: now,
      lastSeenAt: now,
    };
    table.insert(record);
    return {
      id: record.id,
      runId: record.runId,
      category: record.category,
      description: record.description,
      count: record.count,
      firstSeenAt: new Date(record.firstSeenAt),
      lastSeenAt: new Date(record.lastSeenAt),
    };
  }

  async updateCategorizedFailure(id: string, patch: Partial<PersistenceCategorizedFailure>): Promise<PersistenceCategorizedFailure | null> {
    const table = getTable<any>('categorized_failures');
    const updated = table.updateById(id, patch as any);
    return updated ? {
      id: updated.id,
      runId: updated.runId,
      category: updated.category,
      description: updated.description,
      count: updated.count,
      firstSeenAt: new Date(updated.firstSeenAt),
      lastSeenAt: new Date(updated.lastSeenAt),
    } : null;
  }

  async listFailuresByRun(runId: string): Promise<PersistenceCategorizedFailure[]> {
    const table = getTable<any>('categorized_failures');
    return table.filter((f) => f.runId === runId).map((f) => ({
      id: f.id,
      runId: f.runId,
      category: f.category,
      description: f.description,
      count: f.count,
      firstSeenAt: new Date(f.firstSeenAt),
      lastSeenAt: new Date(f.lastSeenAt),
    }));
  }

  // ===== Improvement Recommendations =====
  async createImprovementRecommendation(input: Omit<PersistenceImprovementRecommendation, 'id'>): Promise<PersistenceImprovementRecommendation> {
    const table = getTable<any>('improvements');
    const record = {
      id: `imp_${Date.now().toString(36)}`,
      ...input,
    };
    table.insert(record);
    return {
      id: record.id,
      runId: record.runId ?? null,
      title: record.title,
      description: record.description,
      priority: record.priority,
      category: record.category,
      estimatedGain: record.estimatedGain ?? null,
      appliedAt: record.appliedAt ? new Date(record.appliedAt) : null,
      appliedVersion: record.appliedVersion ?? null,
    };
  }

  async updateImprovementRecommendation(id: string, patch: Partial<PersistenceImprovementRecommendation>): Promise<PersistenceImprovementRecommendation | null> {
    const table = getTable<any>('improvements');
    const updated = table.updateById(id, patch as any);
    return updated ? {
      id: updated.id,
      runId: updated.runId ?? null,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      category: updated.category,
      estimatedGain: updated.estimatedGain ?? null,
      appliedAt: updated.appliedAt ? new Date(updated.appliedAt) : null,
      appliedVersion: updated.appliedVersion ?? null,
    } : null;
  }

  async listImprovementRecommendations(runId?: string): Promise<PersistenceImprovementRecommendation[]> {
    const table = getTable<any>('improvements');
    const recs = runId
      ? table.filter((r) => r.runId === runId)
      : table.list();
    return recs.map((r) => ({
      id: r.id,
      runId: r.runId ?? null,
      title: r.title,
      description: r.description,
      priority: r.priority,
      category: r.category,
      estimatedGain: r.estimatedGain ?? null,
      appliedAt: r.appliedAt ? new Date(r.appliedAt) : null,
      appliedVersion: r.appliedVersion ?? null,
    }));
  }

  // ===== NvJobs =====
  async createNvJob(input: Omit<PersistenceNvJob, 'id' | 'startedAt'>): Promise<PersistenceNvJob> {
    const table = getTable<any>('nvidia_jobs');
    const record = {
      id: `nvj_${Date.now().toString(36)}`,
      ...input,
      startedAt: new Date().toISOString(),
    };
    table.insert(record);
    return {
      id: record.id,
      jobId: record.jobId,
      service: record.service,
      status: record.status,
      payload: record.payload,
      result: record.result,
      error: record.error,
      startedAt: new Date(record.startedAt),
      completedAt: record.completedAt ? new Date(record.completedAt) : null,
    };
  }

  async updateNvJob(id: string, patch: Partial<PersistenceNvJob>): Promise<PersistenceNvJob | null> {
    const table = getTable<any>('nvidia_jobs');
    const updateData: any = {};
    if (patch.status) updateData.status = patch.status;
    if (patch.result) updateData.result = patch.result;
    if (patch.error) updateData.error = patch.error;
    if (patch.completedAt) updateData.completedAt = patch.completedAt.toISOString();
    const updated = table.updateById(id, updateData);
    return updated ? {
      id: updated.id,
      jobId: updated.jobId,
      service: updated.service,
      status: updated.status,
      payload: updated.payload,
      result: updated.result,
      error: updated.error,
      startedAt: new Date(updated.startedAt),
      completedAt: updated.completedAt ? new Date(updated.completedAt) : null,
    } : null;
  }

  async getNvJob(id: string): Promise<PersistenceNvJob | null> {
    const table = getTable<any>('nvidia_jobs');
    const found = table.find((j) => j.id === id);
    if (!found) return null;
    return {
      id: found.id,
      jobId: found.jobId,
      service: found.service,
      status: found.status,
      payload: found.payload,
      result: found.result,
      error: found.error,
      startedAt: new Date(found.startedAt),
      completedAt: found.completedAt ? new Date(found.completedAt) : null,
    };
  }

  async listNvJobs(service?: string, status?: string): Promise<PersistenceNvJob[]> {
    const table = getTable<any>('nvidia_jobs');
    let jobs = table.list();
    if (service) jobs = jobs.filter((j) => j.service === service);
    if (status) jobs = jobs.filter((j) => j.status === status);
    return jobs.map((j) => ({
      id: j.id,
      jobId: j.jobId,
      service: j.service,
      status: j.status,
      payload: j.payload,
      result: j.result,
      error: j.error,
      startedAt: new Date(j.startedAt),
      completedAt: j.completedAt ? new Date(j.completedAt) : null,
    }));
  }

  // ===== Robots =====
  async createRobot(input: Omit<PersistenceRobot, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersistenceRobot> {
    const table = getTable<any>('robots');
    const now = new Date().toISOString();
    const record = {
      id: `rob_${Date.now().toString(36)}`,
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    table.insert(record);
    return {
      id: record.id,
      name: record.name,
      type: record.type,
      manufacturer: record.manufacturer,
      dof: record.dof,
      payloadKg: record.payloadKg,
      reachMm: record.reachMm,
      description: record.description ?? null,
      capabilities: record.capabilities,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    };
  }

  async getRobot(id: string): Promise<PersistenceRobot | null> {
    const table = getTable<any>('robots');
    const found = table.find((r) => r.id === id);
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      type: found.type,
      manufacturer: found.manufacturer,
      dof: found.dof,
      payloadKg: found.payloadKg,
      reachMm: found.reachMm,
      description: found.description ?? null,
      capabilities: found.capabilities,
      createdAt: new Date(found.createdAt),
      updatedAt: new Date(found.updatedAt),
    };
  }

  async listRobots(): Promise<PersistenceRobot[]> {
    const table = getTable<any>('robots');
    return table.list().map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      manufacturer: r.manufacturer,
      dof: r.dof,
      payloadKg: r.payloadKg,
      reachMm: r.reachMm,
      description: r.description ?? null,
      capabilities: r.capabilities,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
    }));
  }

  // ===== Organizations =====
  async createOrganization(name: string): Promise<PersistenceOrganization> {
    const table = getTable<any>('organizations');
    const record = {
      id: `org_${Date.now().toString(36)}`,
      name,
      createdAt: new Date().toISOString(),
    };
    table.insert(record);
    return {
      id: record.id,
      name: record.name,
      createdAt: new Date(record.createdAt),
    };
  }

  async getOrganization(id: string): Promise<PersistenceOrganization | null> {
    const table = getTable<any>('organizations');
    const found = table.find((o) => o.id === id);
    if (!found) return null;
    return {
      id: found.id,
      name: found.name,
      createdAt: new Date(found.createdAt),
    };
  }

  async listOrganizations(): Promise<PersistenceOrganization[]> {
    const table = getTable<any>('organizations');
    return table.list().map((o) => ({
      id: o.id,
      name: o.name,
      createdAt: new Date(o.createdAt),
    }));
  }

  // ===== Health =====
  async checkConnection(): Promise<boolean> {
    return fs.existsSync(dataDir);
  }

  async disconnect(): Promise<void> {
    // No-op for JSON backend
  }
}