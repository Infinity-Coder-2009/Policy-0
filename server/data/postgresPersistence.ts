/**
 * Postgres-backed Persistence Implementation (Prisma)
 * ============================================================
 * Uses Prisma Client to talk to PostgreSQL. Used when DATA_BACKEND=postgres.
 */

import { PrismaClient, FailureCategory } from '@prisma/client';
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

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

function mapUser(u: any): PersistenceUser {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    role: u.role,
    name: u.name,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    organizationId: u.organizationId ?? null,
  };
}

function mapRefreshToken(t: any): PersistenceRefreshToken {
  return {
    id: t.id,
    tokenHash: t.tokenHash,
    userId: t.userId,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt,
  };
}

function mapApiKey(k: any): PersistenceApiKey {
  return {
    id: k.id,
    keyHash: k.keyHash,
    name: k.name,
    userId: k.userId,
    lastUsed: k.lastUsed,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt,
  };
}

function mapPolicy(p: any): PersistencePolicy {
  return {
    id: p.id,
    policy: p.policy,
    mode: p.mode,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

function mapPolicyVersion(v: any): PersistencePolicyVersion {
  return {
    id: v.id,
    policyId: v.policyId,
    version: v.version,
    policyJson: v.policyJson,
    verified: v.verified,
    createdAt: v.createdAt,
  };
}

function mapDeploymentRun(r: any): PersistenceDeploymentRun {
  return {
    id: r.id,
    policyVersionId: r.policyVersionId,
    source: r.source,
    status: r.status,
    success: r.success,
    metrics: r.metrics,
    error: r.error,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
  };
}

function mapFailure(f: any): PersistenceCategorizedFailure {
  return {
    id: f.id,
    runId: f.runId,
    category: f.category,
    description: f.description,
    count: f.count,
    firstSeenAt: f.firstSeenAt,
    lastSeenAt: f.lastSeenAt,
  };
}

function mapRecommendation(r: any): PersistenceImprovementRecommendation {
  return {
    id: r.id,
    runId: r.runId,
    title: r.title,
    description: r.description,
    priority: r.priority,
    category: r.category,
    estimatedGain: r.estimatedGain,
    appliedAt: r.appliedAt,
    appliedVersion: r.appliedVersion,
  };
}

function mapNvJob(j: any): PersistenceNvJob {
  return {
    id: j.id,
    jobId: j.jobId,
    service: j.service,
    status: j.status,
    payload: j.payload,
    result: j.result,
    error: j.error,
    startedAt: j.startedAt,
    completedAt: j.completedAt,
  };
}

function mapRobot(r: any): PersistenceRobot {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    manufacturer: r.manufacturer,
    dof: r.dof,
    payloadKg: r.payloadKg,
    reachMm: r.reachMm,
    description: r.description,
    capabilities: r.capabilities,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapOrg(o: any): PersistenceOrganization {
  return {
    id: o.id,
    name: o.name,
    createdAt: o.createdAt,
  };
}

export class PostgresPersistence implements Persistence {
  // ===== Users =====
  async findUserByEmail(email: string): Promise<PersistenceUser | null> {
    const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return u ? mapUser(u) : null;
  }

  async findUserById(id: string): Promise<PersistenceUser | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    return u ? mapUser(u) : null;
  }

  async createUser(input: { email: string; passwordHash: string; role: PersistenceUser['role']; name?: string }): Promise<PersistenceUser> {
    const u = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        role: input.role,
        name: input.name,
      },
    });
    return mapUser(u);
  }

  async listUsers(): Promise<PersistenceUser[]> {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map(mapUser);
  }

  async countUsers(): Promise<number> {
    return prisma.user.count();
  }

  // ===== Refresh Tokens =====
  async storeRefreshToken(record: { token: string; userId: string; createdAt: string; expiresAt: string }): Promise<PersistenceRefreshToken> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(record.token).digest('hex');
    const t = await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId: record.userId,
        createdAt: new Date(record.createdAt),
        expiresAt: new Date(record.expiresAt),
      },
    });
    // Prune expired
    await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return mapRefreshToken(t);
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async isRefreshTokenValid(token: string): Promise<boolean> {
    const { createHash } = await import('crypto');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const t = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!t) return false;
    return t.expiresAt > new Date();
  }

  // ===== API Keys =====
  async findApiKeyByHash(keyHash: string): Promise<PersistenceApiKey | null> {
    const k = await prisma.apiKey.findUnique({ where: { keyHash } });
    return k ? mapApiKey(k) : null;
  }

  async createApiKey(input: { keyHash: string; name: string; userId: string; expiresAt?: Date }): Promise<PersistenceApiKey> {
    const k = await prisma.apiKey.create({
      data: {
        keyHash: input.keyHash,
        name: input.name,
        userId: input.userId,
        expiresAt: input.expiresAt,
      },
    });
    return mapApiKey(k);
  }

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await prisma.apiKey.update({ where: { id }, data: { lastUsed: new Date() } });
  }

  async listApiKeysByUser(userId: string): Promise<PersistenceApiKey[]> {
    const keys = await prisma.apiKey.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return keys.map(mapApiKey);
  }

  async revokeApiKey(id: string): Promise<void> {
    await prisma.apiKey.delete({ where: { id } });
  }

  // ===== Policies =====
  async savePolicy(policy: any, mode: 'SIMULATED' | 'REAL'): Promise<PersistencePolicy> {
    const existing = await prisma.policy.findUnique({ where: { id: policy.id } });
    let p;
    if (existing) {
      p = await prisma.policy.update({
        where: { id: policy.id },
        data: { policy, mode },
      });
    } else {
      p = await prisma.policy.create({
        data: {
          id: policy.id,
          policy,
          mode,
        },
      });
    }
    return mapPolicy(p);
  }

  async getPolicy(id: string): Promise<PersistencePolicy | null> {
    const p = await prisma.policy.findUnique({ where: { id } });
    return p ? mapPolicy(p) : null;
  }

  async listPolicies(): Promise<PersistencePolicy[]> {
    const policies = await prisma.policy.findMany({ orderBy: { createdAt: 'desc' } });
    return policies.map(mapPolicy);
  }

  async deletePolicy(id: string): Promise<boolean> {
    await prisma.policy.delete({ where: { id } });
    return true;
  }

  async countPolicies(): Promise<number> {
    return prisma.policy.count();
  }

  // ===== Policy Versions =====
  async savePolicyVersion(policy: any, version: number, verified: boolean): Promise<PersistencePolicyVersion> {
    const v = await prisma.policyVersion.create({
      data: {
        policyId: policy.id,
        version,
        policyJson: policy,
        verified,
      },
    });
    return mapPolicyVersion(v);
  }

  async listPolicyVersions(policyId: string): Promise<PersistencePolicyVersion[]> {
    const versions = await prisma.policyVersion.findMany({
      where: { policyId },
      orderBy: { version: 'desc' },
    });
    return versions.map(mapPolicyVersion);
  }

  async latestPolicyVersion(policyId: string): Promise<PersistencePolicyVersion | null> {
    const v = await prisma.policyVersion.findFirst({
      where: { policyId },
      orderBy: { version: 'desc' },
    });
    return v ? mapPolicyVersion(v) : null;
  }

  async markVersionVerified(policyId: string, version: number): Promise<PersistencePolicyVersion | null> {
    const v = await prisma.policyVersion.findFirst({
      where: { policyId, version },
    });
    if (!v) return null;
    const updated = await prisma.policyVersion.update({
      where: { id: v.id },
      data: { verified: true },
    });
    return mapPolicyVersion(updated);
  }

  async allPolicyVersions(): Promise<PersistencePolicyVersion[]> {
    const versions = await prisma.policyVersion.findMany({ orderBy: { createdAt: 'desc' } });
    return versions.map(mapPolicyVersion);
  }

  // ===== Deployment Runs =====
  async createDeploymentRun(input: { policyVersionId: string; source: PersistenceDeploymentRun['source'] }): Promise<PersistenceDeploymentRun> {
    const r = await prisma.deploymentRun.create({
      data: {
        policyVersionId: input.policyVersionId,
        source: input.source,
        status: 'PENDING',
      },
    });
    return mapDeploymentRun(r);
  }

  async updateDeploymentRun(id: string, patch: Partial<PersistenceDeploymentRun>): Promise<PersistenceDeploymentRun | null> {
    const updateData: any = {};
    if (patch.status) updateData.status = patch.status;
    if (patch.success !== undefined) updateData.success = patch.success;
    if (patch.metrics) updateData.metrics = patch.metrics;
    if (patch.error) updateData.error = patch.error;
    if (patch.completedAt) updateData.completedAt = patch.completedAt;
    try {
      const r = await prisma.deploymentRun.update({ where: { id }, data: updateData });
      return mapDeploymentRun(r);
    } catch {
      return null;
    }
  }

  async getDeploymentRun(id: string): Promise<PersistenceDeploymentRun | null> {
    const r = await prisma.deploymentRun.findUnique({ where: { id } });
    return r ? mapDeploymentRun(r) : null;
  }

  async listDeploymentRuns(policyVersionId?: string): Promise<PersistenceDeploymentRun[]> {
    const runs = await prisma.deploymentRun.findMany({
      where: policyVersionId ? { policyVersionId } : undefined,
      orderBy: { startedAt: 'desc' },
    });
    return runs.map(mapDeploymentRun);
  }

  // ===== Categorized Failures =====
  async createCategorizedFailure(input: Omit<PersistenceCategorizedFailure, 'id' | 'firstSeenAt' | 'lastSeenAt'>): Promise<PersistenceCategorizedFailure> {
    const f = await prisma.categorizedFailure.create({
      data: {
        runId: input.runId,
        category: input.category as FailureCategory,
        description: input.description,
        count: input.count,
      },
    });
    return mapFailure(f);
  }

  async updateCategorizedFailure(id: string, patch: Partial<PersistenceCategorizedFailure>): Promise<PersistenceCategorizedFailure | null> {
    try {
      const f = await prisma.categorizedFailure.update({ where: { id }, data: patch as any });
      return mapFailure(f);
    } catch {
      return null;
    }
  }

  async listFailuresByRun(runId: string): Promise<PersistenceCategorizedFailure[]> {
    const failures = await prisma.categorizedFailure.findMany({ where: { runId }, orderBy: { firstSeenAt: 'desc' } });
    return failures.map(mapFailure);
  }

  // ===== Improvement Recommendations =====
  async createImprovementRecommendation(input: Omit<PersistenceImprovementRecommendation, 'id'>): Promise<PersistenceImprovementRecommendation> {
    const r = await prisma.improvementRecommendation.create({
      data: {
        runId: input.runId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        category: input.category,
        estimatedGain: input.estimatedGain,
        appliedAt: input.appliedAt,
        appliedVersion: input.appliedVersion,
      },
    });
    return mapRecommendation(r);
  }

  async updateImprovementRecommendation(id: string, patch: Partial<PersistenceImprovementRecommendation>): Promise<PersistenceImprovementRecommendation | null> {
    try {
      const r = await prisma.improvementRecommendation.update({ where: { id }, data: patch as any });
      return mapRecommendation(r);
    } catch {
      return null;
    }
  }

  async listImprovementRecommendations(runId?: string): Promise<PersistenceImprovementRecommendation[]> {
    const recs = await prisma.improvementRecommendation.findMany({
      where: runId ? { runId } : undefined,
      orderBy: { priority: 'desc' },
    });
    return recs.map(mapRecommendation);
  }

  // ===== NvJobs =====
  async createNvJob(input: Omit<PersistenceNvJob, 'id' | 'startedAt'>): Promise<PersistenceNvJob> {
    const j = await prisma.nvJob.create({
      data: {
        jobId: input.jobId,
        service: input.service,
        status: input.status,
        payload: input.payload,
        result: input.result,
        error: input.error,
      },
    });
    return mapNvJob(j);
  }

  async updateNvJob(id: string, patch: Partial<PersistenceNvJob>): Promise<PersistenceNvJob | null> {
    const updateData: any = {};
    if (patch.status) updateData.status = patch.status;
    if (patch.result) updateData.result = patch.result;
    if (patch.error) updateData.error = patch.error;
    if (patch.completedAt) updateData.completedAt = patch.completedAt;
    try {
      const j = await prisma.nvJob.update({ where: { id }, data: updateData });
      return mapNvJob(j);
    } catch {
      return null;
    }
  }

  async getNvJob(id: string): Promise<PersistenceNvJob | null> {
    const j = await prisma.nvJob.findUnique({ where: { id } });
    return j ? mapNvJob(j) : null;
  }

  async listNvJobs(service?: string, status?: string): Promise<PersistenceNvJob[]> {
    const jobs = await prisma.nvJob.findMany({
      where: {
        ...(service ? { service } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { startedAt: 'desc' },
    });
    return jobs.map(mapNvJob);
  }

  // ===== Robots =====
  async createRobot(input: Omit<PersistenceRobot, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersistenceRobot> {
    const r = await prisma.robot.create({ data: input as any });
    return mapRobot(r);
  }

  async getRobot(id: string): Promise<PersistenceRobot | null> {
    const r = await prisma.robot.findUnique({ where: { id } });
    return r ? mapRobot(r) : null;
  }

  async listRobots(): Promise<PersistenceRobot[]> {
    const robots = await prisma.robot.findMany({ orderBy: { name: 'asc' } });
    return robots.map(mapRobot);
  }

  // ===== Organizations =====
  async createOrganization(name: string): Promise<PersistenceOrganization> {
    const o = await prisma.organization.create({ data: { name } });
    return mapOrg(o);
  }

  async getOrganization(id: string): Promise<PersistenceOrganization | null> {
    const o = await prisma.organization.findUnique({ where: { id } });
    return o ? mapOrg(o) : null;
  }

  async listOrganizations(): Promise<PersistenceOrganization[]> {
    const orgs = await prisma.organization.findMany({ orderBy: { name: 'asc' } });
    return orgs.map(mapOrg);
  }

  // ===== Health =====
  async checkConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}