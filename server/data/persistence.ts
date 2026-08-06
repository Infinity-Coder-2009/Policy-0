/**
 * Policy-0 Persistence Layer
 * ============================================================
 * Unified interface for data access. Swappable between JSON (dev/mock)
 * and Postgres (production) via DATA_BACKEND=json|postgres.
 * All existing stores (authStore, policyStore, etc.) delegate here.
 */

import { AuthUser, RefreshTokenRecord } from './authStore';
import { PolicyRecord, PolicyVersionRecord } from './policyStore';
import { DeploymentRun, CategorizedFailure, ImprovementRecommendation } from '../../src/types';

export type DataBackend = 'json' | 'postgres';

// ===== Core entity types (match Prisma schema) =====

export interface PersistenceUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  name?: string | null;
  createdAt: Date;
  updatedAt: Date;
  organizationId?: string | null;
}

export interface PersistenceRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface PersistenceApiKey {
  id: string;
  keyHash: string;
  name: string;
  userId: string;
  lastUsed?: Date | null;
  createdAt: Date;
  expiresAt?: Date | null;
}

export interface PersistenceOrganization {
  id: string;
  name: string;
  createdAt: Date;
}

export interface PersistenceRobot {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  dof: number;
  payloadKg: number;
  reachMm: number;
  description?: string | null;
  capabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistencePolicy {
  id: string;
  policy: any; // GeneratedPolicy
  mode: 'SIMULATED' | 'REAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface PersistencePolicyVersion {
  id: string;
  policyId: string;
  version: number;
  policyJson: any;
  verified: boolean;
  createdAt: Date;
}

export interface PersistenceDeploymentRun {
  id: string;
  policyVersionId: string;
  source: 'SIMULATED' | 'ISAAC_SIM' | 'ISAAC_LAB' | 'OSMO' | 'REAL_WORLD';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  success?: boolean | null;
  metrics?: any | null;
  error?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

export interface PersistenceCategorizedFailure {
  id: string;
  runId: string;
  category: string;
  description: string;
  count: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface PersistenceImprovementRecommendation {
  id: string;
  runId?: string | null;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  estimatedGain?: number | null;
  appliedAt?: Date | null;
  appliedVersion?: number | null;
}

export interface PersistenceNvJob {
  id: string;
  jobId: string;
  service: string;
  status: string;
  payload?: any | null;
  result?: any | null;
  error?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
}

// ===== Persistence Interface =====

export interface Persistence {
  // Users
  findUserByEmail(email: string): Promise<PersistenceUser | null>;
  findUserById(id: string): Promise<PersistenceUser | null>;
  createUser(input: { email: string; passwordHash: string; role: PersistenceUser['role']; name?: string }): Promise<PersistenceUser>;
  listUsers(): Promise<PersistenceUser[]>;
  countUsers(): Promise<number>;

  // Refresh tokens
  storeRefreshToken(record: { token: string; userId: string; createdAt: string; expiresAt: string }): Promise<PersistenceRefreshToken>;
  revokeRefreshToken(token: string): Promise<void>;
  revokeAllRefreshTokensForUser(userId: string): Promise<void>;
  isRefreshTokenValid(token: string): Promise<boolean>;

  // API Keys
  findApiKeyByHash(keyHash: string): Promise<PersistenceApiKey | null>;
  createApiKey(input: { keyHash: string; name: string; userId: string; expiresAt?: Date }): Promise<PersistenceApiKey>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  listApiKeysByUser(userId: string): Promise<PersistenceApiKey[]>;
  revokeApiKey(id: string): Promise<void>;

  // Policies
  savePolicy(policy: any, mode: 'SIMULATED' | 'REAL'): Promise<PersistencePolicy>;
  getPolicy(id: string): Promise<PersistencePolicy | null>;
  listPolicies(): Promise<PersistencePolicy[]>;
  deletePolicy(id: string): Promise<boolean>;
  countPolicies(): Promise<number>;

  // Policy Versions
  savePolicyVersion(policy: any, version: number, verified: boolean): Promise<PersistencePolicyVersion>;
  listPolicyVersions(policyId: string): Promise<PersistencePolicyVersion[]>;
  latestPolicyVersion(policyId: string): Promise<PersistencePolicyVersion | null>;
  markVersionVerified(policyId: string, version: number): Promise<PersistencePolicyVersion | null>;
  allPolicyVersions(): Promise<PersistencePolicyVersion[]>;

  // Deployment Runs
  createDeploymentRun(input: { policyVersionId: string; source: PersistenceDeploymentRun['source'] }): Promise<PersistenceDeploymentRun>;
  updateDeploymentRun(id: string, patch: Partial<PersistenceDeploymentRun>): Promise<PersistenceDeploymentRun | null>;
  getDeploymentRun(id: string): Promise<PersistenceDeploymentRun | null>;
  listDeploymentRuns(policyVersionId?: string): Promise<PersistenceDeploymentRun[]>;

  // Categorized Failures
  createCategorizedFailure(input: Omit<PersistenceCategorizedFailure, 'id' | 'firstSeenAt' | 'lastSeenAt'>): Promise<PersistenceCategorizedFailure>;
  updateCategorizedFailure(id: string, patch: Partial<PersistenceCategorizedFailure>): Promise<PersistenceCategorizedFailure | null>;
  listFailuresByRun(runId: string): Promise<PersistenceCategorizedFailure[]>;

  // Improvement Recommendations
  createImprovementRecommendation(input: Omit<PersistenceImprovementRecommendation, 'id'>): Promise<PersistenceImprovementRecommendation>;
  updateImprovementRecommendation(id: string, patch: Partial<PersistenceImprovementRecommendation>): Promise<PersistenceImprovementRecommendation | null>;
  listImprovementRecommendations(runId?: string): Promise<PersistenceImprovementRecommendation[]>;

  // NvJobs
  createNvJob(input: Omit<PersistenceNvJob, 'id' | 'startedAt'>): Promise<PersistenceNvJob>;
  updateNvJob(id: string, patch: Partial<PersistenceNvJob>): Promise<PersistenceNvJob | null>;
  getNvJob(id: string): Promise<PersistenceNvJob | null>;
  listNvJobs(service?: string, status?: string): Promise<PersistenceNvJob[]>;

  // Robots
  createRobot(input: Omit<PersistenceRobot, 'id' | 'createdAt' | 'updatedAt'>): Promise<PersistenceRobot>;
  getRobot(id: string): Promise<PersistenceRobot | null>;
  listRobots(): Promise<PersistenceRobot[]>;

  // Organizations
  createOrganization(name: string): Promise<PersistenceOrganization>;
  getOrganization(id: string): Promise<PersistenceOrganization | null>;
  listOrganizations(): Promise<PersistenceOrganization[]>;

  // Health/connection
  checkConnection(): Promise<boolean>;
  disconnect(): Promise<void>;
}

// ===== Backend factory =====

export async function createPersistence(backend: DataBackend): Promise<Persistence> {
  if (backend === 'postgres') {
    const { PostgresPersistence } = await import('./postgresPersistence');
    return new PostgresPersistence();
  }
  const { JsonPersistence } = await import('./jsonPersistence');
  return new JsonPersistence();
}