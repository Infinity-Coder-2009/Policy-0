/**
 * Policy-0 Policy Store
 * ============================================================
 * Persists generated policies and their version lineage server-side.
 * Backed by the pluggable Persistence layer (JSON or Postgres).
 */

import { createPersistence, type DataBackend, type Persistence } from './persistence';
import { GeneratedPolicy } from '../../src/types';

export interface PolicyRecord {
  id: string;
  policy: GeneratedPolicy;
  mode: 'SIMULATED' | 'REAL';
  createdAt: string;
  updatedAt: string;
}

export interface PolicyVersionRecord {
  id: string;
  policyId: string;
  version: number;
  policy: GeneratedPolicy;
  /** True only after the version was re-verified in simulation. */
  verified: boolean;
  createdAt: string;
}

let persistenceInstance: Persistence | null = null;

async function getPersistence(): Promise<Persistence> {
  if (!persistenceInstance) {
    const backend = (process.env.DATA_BACKEND as DataBackend) || 'json';
    persistenceInstance = await createPersistence(backend);
  }
  return persistenceInstance;
}

function mapPolicyRecord(p: any): PolicyRecord {
  return {
    id: p.id,
    policy: p.policy,
    mode: p.mode,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function mapPolicyVersion(v: any): PolicyVersionRecord {
  return {
    id: v.id,
    policyId: v.policyId,
    version: v.version,
    policy: v.policyJson,
    verified: v.verified,
    createdAt: v.createdAt.toISOString(),
  };
}

export async function savePolicy(policy: GeneratedPolicy, mode: 'SIMULATED' | 'REAL' = 'SIMULATED'): Promise<PolicyRecord> {
  const persistence = await getPersistence();
  const result = await persistence.savePolicy(policy, mode);
  return mapPolicyRecord(result);
}

export async function getPolicy(id: string): Promise<PolicyRecord | null> {
  const persistence = await getPersistence();
  const result = await persistence.getPolicy(id);
  return result ? mapPolicyRecord(result) : null;
}

export async function listPolicies(): Promise<PolicyRecord[]> {
  const persistence = await getPersistence();
  const results = await persistence.listPolicies();
  return results.map(mapPolicyRecord);
}

export async function deletePolicy(id: string): Promise<boolean> {
  const persistence = await getPersistence();
  return persistence.deletePolicy(id);
}

export async function countPolicies(): Promise<number> {
  const persistence = await getPersistence();
  return persistence.countPolicies();
}

export async function savePolicyVersion(policy: GeneratedPolicy, version: number, verified: boolean = false): Promise<PolicyVersionRecord> {
  const persistence = await getPersistence();
  const result = await persistence.savePolicyVersion(policy, version, verified);
  return mapPolicyVersion(result);
}

export async function listPolicyVersions(policyId: string): Promise<PolicyVersionRecord[]> {
  const persistence = await getPersistence();
  const results = await persistence.listPolicyVersions(policyId);
  return results.map(mapPolicyVersion);
}

export async function latestPolicyVersion(policyId: string): Promise<PolicyVersionRecord | null> {
  const persistence = await getPersistence();
  const result = await persistence.latestPolicyVersion(policyId);
  return result ? mapPolicyVersion(result) : null;
}

export async function markVersionVerified(policyId: string, version: number): Promise<PolicyVersionRecord | null> {
  const persistence = await getPersistence();
  const result = await persistence.markVersionVerified(policyId, version);
  return result ? mapPolicyVersion(result) : null;
}

export async function allVersions(): Promise<PolicyVersionRecord[]> {
  const persistence = await getPersistence();
  const results = await persistence.allPolicyVersions();
  return results.map(mapPolicyVersion);
}