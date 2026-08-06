/**
 * Policy-0 Auth Store
 * ============================================================
 * Persists users and refresh tokens via the pluggable Persistence layer.
 * Supports JSON (default) and Postgres backends via DATA_BACKEND env.
 * Exposes the exact API the auth routes need, so the backend can
 * be swapped without changing route code.
 */

import { createPersistence, type DataBackend, type Persistence, type PersistenceUser, type PersistenceRefreshToken } from './persistence';

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'operator' | 'viewer';
  name?: string;
  createdAt: string;
}

export interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

let persistenceInstance: Persistence | null = null;

async function getPersistence(): Promise<Persistence> {
  if (!persistenceInstance) {
    const backend = (process.env.DATA_BACKEND as DataBackend) || 'json';
    persistenceInstance = await createPersistence(backend);
  }
  return persistenceInstance;
}

function mapRole(role: PersistenceUser['role']): AuthUser['role'] {
  return role.toLowerCase() as AuthUser['role'];
}

function mapUser(user: PersistenceUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    role: mapRole(user.role),
    name: user.name ?? undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

function mapRefreshToken(token: PersistenceRefreshToken): RefreshTokenRecord {
  return {
    id: token.id,
    tokenHash: token.tokenHash,
    userId: token.userId,
    createdAt: token.createdAt.toISOString(),
    expiresAt: token.expiresAt.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<AuthUser | null> {
  const persistence = await getPersistence();
  const user = await persistence.findUserByEmail(email);
  return user ? mapUser(user) : null;
}

export async function findUserById(id: string): Promise<AuthUser | null> {
  const persistence = await getPersistence();
  const user = await persistence.findUserById(id);
  return user ? mapUser(user) : null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  role: AuthUser['role'];
  name?: string;
}): Promise<AuthUser> {
  const persistence = await getPersistence();
  const role = input.role.toUpperCase() as PersistenceUser['role'];
  const user = await persistence.createUser({
    email: input.email,
    passwordHash: input.passwordHash,
    role,
    name: input.name,
  });
  return mapUser(user);
}

export async function listUsers(): Promise<AuthUser[]> {
  const persistence = await getPersistence();
  const users = await persistence.listUsers();
  return users.map(mapUser);
}

export async function countUsers(): Promise<number> {
  const persistence = await getPersistence();
  return persistence.countUsers();
}

export async function storeRefreshToken(record: Omit<RefreshTokenRecord, 'id' | 'tokenHash'> & { token: string }): Promise<RefreshTokenRecord> {
  const persistence = await getPersistence();
  const token = await persistence.storeRefreshToken({
    token: record.token,
    userId: record.userId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  });
  return mapRefreshToken(token);
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const persistence = await getPersistence();
  await persistence.revokeRefreshToken(token);
}

export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  const persistence = await getPersistence();
  await persistence.revokeAllRefreshTokensForUser(userId);
}

export async function isRefreshTokenValid(token: string): Promise<boolean> {
  const persistence = await getPersistence();
  return persistence.isRefreshTokenValid(token);
}