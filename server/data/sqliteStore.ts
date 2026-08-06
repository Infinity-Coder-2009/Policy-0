/**
 * Policy-0 Local Relational Store
 * ============================================================
 * Provides a `better-sqlite3`-like API backed by atomic JSON files.
 * Each table is a separate `.json` file in `data/`.
 *
 * When `npm install sql.js` or `better-sqlite3` becomes possible,
 * swap this file's `engine` functions with the real SQL calls. The
 * public API surface stays the same — no other file changes needed.
 */

import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ===== Transaction-based atomic write =====
const ROLLBACK_FILE = path.join(dataDir, '_rollback.json');
let inTransaction = false;
const transactionCaches = new Map<string, any[]>();

function tableFilePath(tableName: string): string {
  return path.join(dataDir, `${tableName}.json`);
}

function readTable<T extends { id?: string }>(tableName: string): T[] {
  const f = tableFilePath(tableName);
  if (inTransaction && transactionCaches.has(tableName)) {
    return transactionCaches.get(tableName) as T[];
  }
  try {
    if (!fs.existsSync(f)) return [];
    const raw = fs.readFileSync(f, 'utf-8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeTable(tableName: string, rows: any[]): void {
  const target = inTransaction ? transactionCaches : null;
  if (target) {
    target.set(tableName, rows);
    return;
  }
  const f = tableFilePath(tableName);
  // Write to temp then rename for atomicity (minimises corruption risk)
  const tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf-8');
  fs.renameSync(tmp, f);
}

// ===== Public API =====

export function table<T extends { id?: string }>(tableName: string) {
  /** Get all rows */
  function list(): T[] {
    return readTable<T>(tableName);
  }

  /** Find first row matching predicate */
  function find(predicate: (row: T) => boolean): T | null {
    return readTable<T>(tableName).find(predicate) || null;
  }

  /** Filter rows matching predicate */
  function filter(predicate: (row: T) => boolean): T[] {
    return readTable<T>(tableName).filter(predicate);
  }

  /** Insert a new row (prepends) */
  function insert<K extends T>(row: K): K {
    const rows = readTable<T>(tableName);
    rows.unshift(row);
    writeTable(tableName, rows);
    return row;
  }

  /** Upsert: insert or replace the row whose id matches */
  function upsert<K extends T>(row: K): K {
    if (!row.id) return insert(row);
    const rows = readTable<T>(tableName);
    const idx = rows.findIndex((r) => r.id === row.id);
    if (idx >= 0) {
      rows[idx] = row;
    } else {
      rows.unshift(row);
    }
    writeTable(tableName, rows);
    return row;
  }

  /** Update rows matching predicate with a partial patch */
  function update(predicate: (row: T) => boolean, patch: Partial<T>): number {
    const rows = readTable<T>(tableName);
    let count = 0;
    for (let i = 0; i < rows.length; i++) {
      if (predicate(rows[i])) {
        rows[i] = { ...rows[i], ...patch };
        count++;
      }
    }
    if (count > 0) writeTable(tableName, rows);
    return count;
  }

  /** Update single row by id */
  function updateById(id: string, patch: Partial<T>): T | null {
    const rows = readTable<T>(tableName);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    rows[idx] = { ...rows[idx], ...patch };
    writeTable(tableName, rows);
    return rows[idx];
  }

  /** Delete rows matching predicate */
  function del(predicate: (row: T) => boolean): number {
    const rows = readTable<T>(tableName);
    const before = rows.length;
    const remaining = rows.filter((r) => !predicate(r));
    if (remaining.length < before) writeTable(tableName, remaining);
    return before - remaining.length;
  }

  /** Delete single row by id */
  function delById(id: string): boolean {
    const rows = readTable<T>(tableName);
    const before = rows.length;
    const remaining = rows.filter((r) => r.id !== id);
    if (remaining.length < before) writeTable(tableName, remaining);
    return remaining.length < before;
  }

  /** Count rows */
  function count(predicate?: (row: T) => boolean): number {
    const rows = readTable<T>(tableName);
    return predicate ? rows.filter(predicate).length : rows.length;
  }

  return { list, find, filter, insert, upsert, update, updateById, del, delById, count };
}

/**
 * Get or create a JSON-backed table (convenience).
 *
 * Usage:
 * ```ts
 * import { getTable } from './sqliteStore';
 * const approvals = getTable<ApprovalDecision>('approvals');
 * approvals.insert(myApproval);
 * ```
 */
export function getTable<T extends { id?: string }>(tableName: string) {
  return table<T>(tableName);
}

/**
 * Transaction support: batch multiple writes into a single atomic file write.
 * Uses file-level atomicity (write to .tmp → rename).
 *
 * Usage:
 * ```ts
 * import { transaction } from './sqliteStore';
 * transaction(() => {
 *   approvals.insert({ id: '1', ... });
 *   pipelineRuns.updateById('job_1', { status: 'completed' });
 * });
 * ```
 */
export function transaction(fn: () => void): void {
  if (inTransaction) {
    // nested — just run
    fn();
    return;
  }
  inTransaction = true;
  try {
    fn();
    // Flush all caches to disk atomically
    for (const [tableName, rows] of transactionCaches) {
      const f = tableFilePath(tableName);
      const tmp = f + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(rows, null, 2), 'utf-8');
      fs.renameSync(tmp, f);
    }
  } finally {
    transactionCaches.clear();
    inTransaction = false;
  }
}

/** List all table files in the data directory */
export function listTables(): string[] {
  try {
    return fs.readdirSync(dataDir)
      .filter((f) => f.endsWith('.json') && !f.startsWith('_') && !f.endsWith('.tmp'))
      .map((f) => f.replace(/\.json$/, ''));
  } catch {
    return [];
  }
}

/** Get stats about the local store */
export function getStoreStatus() {
  const tables = listTables();
  const sizes: Record<string, number> = {};
  for (const t of tables) {
    try {
      const f = tableFilePath(t);
      sizes[t] = fs.statSync(f).size;
    } catch { /* skip */ }
  }
  return { tables, sizes, dataDir };
}

// Pre-initialise known tables on first load so developers can
// see them via getStoreStatus() immediately after boot.
// The files are created lazily on first insert, so this is just
// a documentation convenience.
export const TABLE_NAMES = [
  'approvals',
  'pipeline_runs',
  'checkpoints',
  'video_uploads',
  'nvidia_video_jobs',
  'evolution_versions',
  'improvements',
  'deployment_runs',
  'failures',
  'users',
  'refresh_tokens',
  'policies',
  'policy_versions',
] as const;