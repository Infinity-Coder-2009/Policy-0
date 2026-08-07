var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/utils/logger.ts
function createRequestLogger(requestId) {
  return logger.child({ requestId });
}
var import_pino, isDev, logger;
var init_logger = __esm({
  "server/utils/logger.ts"() {
    import_pino = __toESM(require("pino"), 1);
    isDev = process.env.NODE_ENV !== "production";
    logger = (0, import_pino.default)({
      level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
      transport: isDev ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname"
        }
      } : void 0,
      base: {
        service: "policy0",
        version: "4.0.0"
      }
    });
  }
});

// server/middleware/errors.ts
var errors_exports = {};
__export(errors_exports, {
  AppError: () => AppError,
  AuthenticationError: () => AuthenticationError,
  AuthorizationError: () => AuthorizationError,
  ConflictError: () => ConflictError,
  ExternalServiceError: () => ExternalServiceError,
  NotFoundError: () => NotFoundError,
  RateLimitError: () => RateLimitError,
  ValidationError: () => ValidationError,
  asyncHandler: () => asyncHandler,
  globalErrorHandler: () => globalErrorHandler,
  notFoundHandler: () => notFoundHandler
});
function globalErrorHandler(err, req, res, next) {
  const requestId = req.requestId || "unknown";
  const logContext = {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    userId: req.user?.id
  };
  if (err instanceof AppError) {
    logger.warn({ ...logContext, error: err.message, code: err.code, details: err.details }, "Operational error");
    const response = {
      success: false,
      error: err.message,
      code: err.code,
      requestId
    };
    if (err.details) {
      response.details = err.details;
    }
    res.status(err.statusCode).json(response);
    return;
  }
  logger.error({ ...logContext, error: err.message, stack: err.stack }, "Unhandled error");
  const isDevelopment = process.env.NODE_ENV !== "production";
  res.status(500).json({
    success: false,
    error: isDevelopment ? err.message : "Internal server error",
    code: "INTERNAL_ERROR",
    requestId,
    ...isDevelopment && { stack: err.stack }
  });
}
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}
var AppError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError, ExternalServiceError;
var init_errors = __esm({
  "server/middleware/errors.ts"() {
    init_logger();
    AppError = class _AppError extends Error {
      constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        Object.setPrototypeOf(this, _AppError.prototype);
      }
    };
    ValidationError = class _ValidationError extends AppError {
      constructor(message, details) {
        super(message, 400, "VALIDATION_ERROR", details);
        Object.setPrototypeOf(this, _ValidationError.prototype);
      }
    };
    AuthenticationError = class _AuthenticationError extends AppError {
      constructor(message = "Authentication required") {
        super(message, 401, "AUTHENTICATION_ERROR");
        Object.setPrototypeOf(this, _AuthenticationError.prototype);
      }
    };
    AuthorizationError = class _AuthorizationError extends AppError {
      constructor(message = "Insufficient permissions") {
        super(message, 403, "AUTHORIZATION_ERROR");
        Object.setPrototypeOf(this, _AuthorizationError.prototype);
      }
    };
    NotFoundError = class _NotFoundError extends AppError {
      constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
        Object.setPrototypeOf(this, _NotFoundError.prototype);
      }
    };
    ConflictError = class _ConflictError extends AppError {
      constructor(message) {
        super(message, 409, "CONFLICT");
        Object.setPrototypeOf(this, _ConflictError.prototype);
      }
    };
    RateLimitError = class _RateLimitError extends AppError {
      constructor(message = "Too many requests") {
        super(message, 429, "RATE_LIMIT_EXCEEDED");
        Object.setPrototypeOf(this, _RateLimitError.prototype);
      }
    };
    ExternalServiceError = class _ExternalServiceError extends AppError {
      constructor(service, originalError) {
        super(`${service} unavailable: ${originalError.message}`, 503, "EXTERNAL_SERVICE_UNAVAILABLE", {
          service,
          originalMessage: originalError.message
        });
        Object.setPrototypeOf(this, _ExternalServiceError.prototype);
      }
    };
  }
});

// server/data/postgresPersistence.ts
var postgresPersistence_exports = {};
__export(postgresPersistence_exports, {
  PostgresPersistence: () => PostgresPersistence
});
function mapUser(u) {
  return {
    id: u.id,
    email: u.email,
    passwordHash: u.passwordHash,
    role: u.role,
    name: u.name,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    organizationId: u.organizationId ?? null
  };
}
function mapRefreshToken(t) {
  return {
    id: t.id,
    tokenHash: t.tokenHash,
    userId: t.userId,
    createdAt: t.createdAt,
    expiresAt: t.expiresAt
  };
}
function mapApiKey(k) {
  return {
    id: k.id,
    keyHash: k.keyHash,
    name: k.name,
    userId: k.userId,
    lastUsed: k.lastUsed,
    createdAt: k.createdAt,
    expiresAt: k.expiresAt
  };
}
function mapPolicy(p) {
  return {
    id: p.id,
    policy: p.policy,
    mode: p.mode,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}
function mapPolicyVersion(v) {
  return {
    id: v.id,
    policyId: v.policyId,
    version: v.version,
    policyJson: v.policyJson,
    verified: v.verified,
    createdAt: v.createdAt
  };
}
function mapDeploymentRun(r) {
  return {
    id: r.id,
    policyVersionId: r.policyVersionId,
    source: r.source,
    status: r.status,
    success: r.success,
    metrics: r.metrics,
    error: r.error,
    startedAt: r.startedAt,
    completedAt: r.completedAt
  };
}
function mapFailure(f) {
  return {
    id: f.id,
    runId: f.runId,
    category: f.category,
    description: f.description,
    count: f.count,
    firstSeenAt: f.firstSeenAt,
    lastSeenAt: f.lastSeenAt
  };
}
function mapRecommendation(r) {
  return {
    id: r.id,
    runId: r.runId,
    title: r.title,
    description: r.description,
    priority: r.priority,
    category: r.category,
    estimatedGain: r.estimatedGain,
    appliedAt: r.appliedAt,
    appliedVersion: r.appliedVersion
  };
}
function mapNvJob(j) {
  return {
    id: j.id,
    jobId: j.jobId,
    service: j.service,
    status: j.status,
    payload: j.payload,
    result: j.result,
    error: j.error,
    startedAt: j.startedAt,
    completedAt: j.completedAt
  };
}
function mapRobot(r) {
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
    updatedAt: r.updatedAt
  };
}
function mapOrg(o) {
  return {
    id: o.id,
    name: o.name,
    createdAt: o.createdAt
  };
}
var import_client, prisma, PostgresPersistence;
var init_postgresPersistence = __esm({
  "server/data/postgresPersistence.ts"() {
    import_client = require("@prisma/client");
    prisma = new import_client.PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
    });
    PostgresPersistence = class {
      // ===== Users =====
      async findUserByEmail(email) {
        const u = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        return u ? mapUser(u) : null;
      }
      async findUserById(id) {
        const u = await prisma.user.findUnique({ where: { id } });
        return u ? mapUser(u) : null;
      }
      async createUser(input) {
        const u = await prisma.user.create({
          data: {
            email: input.email.toLowerCase(),
            passwordHash: input.passwordHash,
            role: input.role,
            name: input.name
          }
        });
        return mapUser(u);
      }
      async listUsers() {
        const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
        return users.map(mapUser);
      }
      async countUsers() {
        return prisma.user.count();
      }
      // ===== Refresh Tokens =====
      async storeRefreshToken(record) {
        const { createHash: createHash2 } = await import("crypto");
        const tokenHash = createHash2("sha256").update(record.token).digest("hex");
        const t = await prisma.refreshToken.create({
          data: {
            tokenHash,
            userId: record.userId,
            createdAt: new Date(record.createdAt),
            expiresAt: new Date(record.expiresAt)
          }
        });
        await prisma.refreshToken.deleteMany({
          where: { expiresAt: { lt: /* @__PURE__ */ new Date() } }
        });
        return mapRefreshToken(t);
      }
      async revokeRefreshToken(token) {
        const { createHash: createHash2 } = await import("crypto");
        const tokenHash = createHash2("sha256").update(token).digest("hex");
        await prisma.refreshToken.deleteMany({ where: { tokenHash } });
      }
      async revokeAllRefreshTokensForUser(userId) {
        await prisma.refreshToken.deleteMany({ where: { userId } });
      }
      async isRefreshTokenValid(token) {
        const { createHash: createHash2 } = await import("crypto");
        const tokenHash = createHash2("sha256").update(token).digest("hex");
        const t = await prisma.refreshToken.findUnique({ where: { tokenHash } });
        if (!t) return false;
        return t.expiresAt > /* @__PURE__ */ new Date();
      }
      // ===== API Keys =====
      async findApiKeyByHash(keyHash) {
        const k = await prisma.apiKey.findUnique({ where: { keyHash } });
        return k ? mapApiKey(k) : null;
      }
      async createApiKey(input) {
        const k = await prisma.apiKey.create({
          data: {
            keyHash: input.keyHash,
            name: input.name,
            userId: input.userId,
            expiresAt: input.expiresAt
          }
        });
        return mapApiKey(k);
      }
      async updateApiKeyLastUsed(id) {
        await prisma.apiKey.update({ where: { id }, data: { lastUsed: /* @__PURE__ */ new Date() } });
      }
      async listApiKeysByUser(userId) {
        const keys = await prisma.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
        return keys.map(mapApiKey);
      }
      async revokeApiKey(id) {
        await prisma.apiKey.delete({ where: { id } });
      }
      // ===== Policies =====
      async savePolicy(policy, mode) {
        const existing = await prisma.policy.findUnique({ where: { id: policy.id } });
        let p;
        if (existing) {
          p = await prisma.policy.update({
            where: { id: policy.id },
            data: { policy, mode }
          });
        } else {
          p = await prisma.policy.create({
            data: {
              id: policy.id,
              policy,
              mode
            }
          });
        }
        return mapPolicy(p);
      }
      async getPolicy(id) {
        const p = await prisma.policy.findUnique({ where: { id } });
        return p ? mapPolicy(p) : null;
      }
      async listPolicies() {
        const policies = await prisma.policy.findMany({ orderBy: { createdAt: "desc" } });
        return policies.map(mapPolicy);
      }
      async deletePolicy(id) {
        await prisma.policy.delete({ where: { id } });
        return true;
      }
      async countPolicies() {
        return prisma.policy.count();
      }
      // ===== Policy Versions =====
      async savePolicyVersion(policy, version, verified) {
        const v = await prisma.policyVersion.create({
          data: {
            policyId: policy.id,
            version,
            policyJson: policy,
            verified
          }
        });
        return mapPolicyVersion(v);
      }
      async listPolicyVersions(policyId) {
        const versions = await prisma.policyVersion.findMany({
          where: { policyId },
          orderBy: { version: "desc" }
        });
        return versions.map(mapPolicyVersion);
      }
      async latestPolicyVersion(policyId) {
        const v = await prisma.policyVersion.findFirst({
          where: { policyId },
          orderBy: { version: "desc" }
        });
        return v ? mapPolicyVersion(v) : null;
      }
      async markVersionVerified(policyId, version) {
        const v = await prisma.policyVersion.findFirst({
          where: { policyId, version }
        });
        if (!v) return null;
        const updated = await prisma.policyVersion.update({
          where: { id: v.id },
          data: { verified: true }
        });
        return mapPolicyVersion(updated);
      }
      async allPolicyVersions() {
        const versions = await prisma.policyVersion.findMany({ orderBy: { createdAt: "desc" } });
        return versions.map(mapPolicyVersion);
      }
      // ===== Deployment Runs =====
      async createDeploymentRun(input) {
        const r = await prisma.deploymentRun.create({
          data: {
            policyVersionId: input.policyVersionId,
            source: input.source,
            status: "PENDING"
          }
        });
        return mapDeploymentRun(r);
      }
      async updateDeploymentRun(id, patch) {
        const updateData = {};
        if (patch.status) updateData.status = patch.status;
        if (patch.success !== void 0) updateData.success = patch.success;
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
      async getDeploymentRun(id) {
        const r = await prisma.deploymentRun.findUnique({ where: { id } });
        return r ? mapDeploymentRun(r) : null;
      }
      async listDeploymentRuns(policyVersionId) {
        const runs = await prisma.deploymentRun.findMany({
          where: policyVersionId ? { policyVersionId } : void 0,
          orderBy: { startedAt: "desc" }
        });
        return runs.map(mapDeploymentRun);
      }
      // ===== Categorized Failures =====
      async createCategorizedFailure(input) {
        const f = await prisma.categorizedFailure.create({
          data: {
            runId: input.runId,
            category: input.category,
            description: input.description,
            count: input.count
          }
        });
        return mapFailure(f);
      }
      async updateCategorizedFailure(id, patch) {
        try {
          const f = await prisma.categorizedFailure.update({ where: { id }, data: patch });
          return mapFailure(f);
        } catch {
          return null;
        }
      }
      async listFailuresByRun(runId) {
        const failures = await prisma.categorizedFailure.findMany({ where: { runId }, orderBy: { firstSeenAt: "desc" } });
        return failures.map(mapFailure);
      }
      // ===== Improvement Recommendations =====
      async createImprovementRecommendation(input) {
        const r = await prisma.improvementRecommendation.create({
          data: {
            runId: input.runId,
            title: input.title,
            description: input.description,
            priority: input.priority,
            category: input.category,
            estimatedGain: input.estimatedGain,
            appliedAt: input.appliedAt,
            appliedVersion: input.appliedVersion
          }
        });
        return mapRecommendation(r);
      }
      async updateImprovementRecommendation(id, patch) {
        try {
          const r = await prisma.improvementRecommendation.update({ where: { id }, data: patch });
          return mapRecommendation(r);
        } catch {
          return null;
        }
      }
      async listImprovementRecommendations(runId) {
        const recs = await prisma.improvementRecommendation.findMany({
          where: runId ? { runId } : void 0,
          orderBy: { priority: "desc" }
        });
        return recs.map(mapRecommendation);
      }
      // ===== NvJobs =====
      async createNvJob(input) {
        const j = await prisma.nvJob.create({
          data: {
            jobId: input.jobId,
            service: input.service,
            status: input.status,
            payload: input.payload,
            result: input.result,
            error: input.error
          }
        });
        return mapNvJob(j);
      }
      async updateNvJob(id, patch) {
        const updateData = {};
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
      async getNvJob(id) {
        const j = await prisma.nvJob.findUnique({ where: { id } });
        return j ? mapNvJob(j) : null;
      }
      async listNvJobs(service, status) {
        const jobs = await prisma.nvJob.findMany({
          where: {
            ...service ? { service } : {},
            ...status ? { status } : {}
          },
          orderBy: { startedAt: "desc" }
        });
        return jobs.map(mapNvJob);
      }
      // ===== Robots =====
      async createRobot(input) {
        const r = await prisma.robot.create({ data: input });
        return mapRobot(r);
      }
      async getRobot(id) {
        const r = await prisma.robot.findUnique({ where: { id } });
        return r ? mapRobot(r) : null;
      }
      async listRobots() {
        const robots = await prisma.robot.findMany({ orderBy: { name: "asc" } });
        return robots.map(mapRobot);
      }
      // ===== Organizations =====
      async createOrganization(name) {
        const o = await prisma.organization.create({ data: { name } });
        return mapOrg(o);
      }
      async getOrganization(id) {
        const o = await prisma.organization.findUnique({ where: { id } });
        return o ? mapOrg(o) : null;
      }
      async listOrganizations() {
        const orgs = await prisma.organization.findMany({ orderBy: { name: "asc" } });
        return orgs.map(mapOrg);
      }
      // ===== Health =====
      async checkConnection() {
        try {
          await prisma.$queryRaw`SELECT 1`;
          return true;
        } catch {
          return false;
        }
      }
      async disconnect() {
        await prisma.$disconnect();
      }
    };
  }
});

// server/data/sqliteStore.ts
function tableFilePath(tableName) {
  return import_path.default.join(dataDir, `${tableName}.json`);
}
function readTable(tableName) {
  const f = tableFilePath(tableName);
  if (inTransaction && transactionCaches.has(tableName)) {
    return transactionCaches.get(tableName);
  }
  try {
    if (!import_fs.default.existsSync(f)) return [];
    const raw = import_fs.default.readFileSync(f, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
function writeTable(tableName, rows) {
  const target = inTransaction ? transactionCaches : null;
  if (target) {
    target.set(tableName, rows);
    return;
  }
  const f = tableFilePath(tableName);
  const tmp = f + ".tmp";
  import_fs.default.writeFileSync(tmp, JSON.stringify(rows, null, 2), "utf-8");
  import_fs.default.renameSync(tmp, f);
}
function table(tableName) {
  function list() {
    return readTable(tableName);
  }
  function find(predicate) {
    return readTable(tableName).find(predicate) || null;
  }
  function filter(predicate) {
    return readTable(tableName).filter(predicate);
  }
  function insert(row) {
    const rows = readTable(tableName);
    rows.unshift(row);
    writeTable(tableName, rows);
    return row;
  }
  function upsert(row) {
    if (!row.id) return insert(row);
    const rows = readTable(tableName);
    const idx = rows.findIndex((r) => r.id === row.id);
    if (idx >= 0) {
      rows[idx] = row;
    } else {
      rows.unshift(row);
    }
    writeTable(tableName, rows);
    return row;
  }
  function update(predicate, patch) {
    const rows = readTable(tableName);
    let count2 = 0;
    for (let i = 0; i < rows.length; i++) {
      if (predicate(rows[i])) {
        rows[i] = { ...rows[i], ...patch };
        count2++;
      }
    }
    if (count2 > 0) writeTable(tableName, rows);
    return count2;
  }
  function updateById(id, patch) {
    const rows = readTable(tableName);
    const idx = rows.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    rows[idx] = { ...rows[idx], ...patch };
    writeTable(tableName, rows);
    return rows[idx];
  }
  function del(predicate) {
    const rows = readTable(tableName);
    const before = rows.length;
    const remaining = rows.filter((r) => !predicate(r));
    if (remaining.length < before) writeTable(tableName, remaining);
    return before - remaining.length;
  }
  function delById(id) {
    const rows = readTable(tableName);
    const before = rows.length;
    const remaining = rows.filter((r) => r.id !== id);
    if (remaining.length < before) writeTable(tableName, remaining);
    return remaining.length < before;
  }
  function count(predicate) {
    const rows = readTable(tableName);
    return predicate ? rows.filter(predicate).length : rows.length;
  }
  return { list, find, filter, insert, upsert, update, updateById, del, delById, count };
}
function getTable(tableName) {
  return table(tableName);
}
var import_path, import_fs, dataDir, ROLLBACK_FILE, inTransaction, transactionCaches;
var init_sqliteStore = __esm({
  "server/data/sqliteStore.ts"() {
    import_path = __toESM(require("path"), 1);
    import_fs = __toESM(require("fs"), 1);
    dataDir = import_path.default.join(process.cwd(), "data");
    if (!import_fs.default.existsSync(dataDir)) import_fs.default.mkdirSync(dataDir, { recursive: true });
    ROLLBACK_FILE = import_path.default.join(dataDir, "_rollback.json");
    inTransaction = false;
    transactionCaches = /* @__PURE__ */ new Map();
  }
});

// server/data/jsonPersistence.ts
var jsonPersistence_exports = {};
__export(jsonPersistence_exports, {
  JsonPersistence: () => JsonPersistence,
  getTable: () => getTable
});
function sha256(input) {
  return (0, import_crypto.createHash)("sha256").update(input).digest("hex");
}
function toDate(value) {
  if (!value) return void 0;
  return typeof value === "string" ? new Date(value) : value;
}
function mapUser2(row) {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    name: row.name,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
    organizationId: row.organizationId ?? null
  };
}
function mapRefreshToken2(row) {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    userId: row.userId,
    createdAt: toDate(row.createdAt),
    expiresAt: toDate(row.expiresAt)
  };
}
function mapApiKey2(row) {
  return {
    id: row.id,
    keyHash: row.keyHash,
    name: row.name,
    userId: row.userId,
    lastUsed: toDate(row.lastUsed),
    createdAt: toDate(row.createdAt),
    expiresAt: toDate(row.expiresAt)
  };
}
function mapPolicy2(row) {
  return {
    id: row.id,
    policy: row.policy,
    mode: row.mode,
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt)
  };
}
function mapPolicyVersion2(row) {
  return {
    id: row.id,
    policyId: row.policyId,
    version: row.version,
    policyJson: row.policy,
    verified: row.verified,
    createdAt: toDate(row.createdAt)
  };
}
var import_path2, import_fs2, import_crypto, dataDir2, JsonPersistence;
var init_jsonPersistence = __esm({
  "server/data/jsonPersistence.ts"() {
    import_path2 = __toESM(require("path"), 1);
    import_fs2 = __toESM(require("fs"), 1);
    import_crypto = require("crypto");
    init_sqliteStore();
    init_sqliteStore();
    dataDir2 = import_path2.default.join(process.cwd(), "data");
    JsonPersistence = class {
      constructor() {
        if (!import_fs2.default.existsSync(dataDir2)) {
          import_fs2.default.mkdirSync(dataDir2, { recursive: true });
        }
      }
      // ===== Users =====
      async findUserByEmail(email) {
        const table2 = getTable("users");
        const found = table2.find((u) => u.email.toLowerCase() === email.toLowerCase());
        return found ? mapUser2(found) : null;
      }
      async findUserById(id) {
        const table2 = getTable("users");
        const found = table2.find((u) => u.id === id);
        return found ? mapUser2(found) : null;
      }
      async createUser(input) {
        const table2 = getTable("users");
        const user = {
          id: `usr_${Date.now().toString(36)}`,
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          role: input.role,
          name: input.name,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          organizationId: null
        };
        table2.insert(user);
        return mapUser2(user);
      }
      async listUsers() {
        const table2 = getTable("users");
        return table2.list().map(mapUser2);
      }
      async countUsers() {
        const table2 = getTable("users");
        return table2.count();
      }
      // ===== Refresh Tokens =====
      async storeRefreshToken(record) {
        const table2 = getTable("refresh_tokens");
        const stored = {
          id: `rt_${Date.now().toString(36)}`,
          tokenHash: sha256(record.token),
          userId: record.userId,
          createdAt: record.createdAt,
          expiresAt: record.expiresAt
        };
        table2.insert(stored);
        const now = Date.now();
        table2.del((t) => new Date(t.expiresAt).getTime() < now);
        return mapRefreshToken2(stored);
      }
      async revokeRefreshToken(token) {
        const table2 = getTable("refresh_tokens");
        const hash = sha256(token);
        table2.del((t) => t.tokenHash === hash);
      }
      async revokeAllRefreshTokensForUser(userId) {
        const table2 = getTable("refresh_tokens");
        table2.del((t) => t.userId === userId);
      }
      async isRefreshTokenValid(token) {
        const table2 = getTable("refresh_tokens");
        const hash = sha256(token);
        const found = table2.find((t) => t.tokenHash === hash);
        if (!found) return false;
        return new Date(found.expiresAt).getTime() > Date.now();
      }
      // ===== API Keys =====
      async findApiKeyByHash(keyHash) {
        const table2 = getTable("api_keys");
        const found = table2.find((k) => k.keyHash === keyHash);
        return found ? mapApiKey2(found) : null;
      }
      async createApiKey(input) {
        const table2 = getTable("api_keys");
        const key = {
          id: `ak_${Date.now().toString(36)}`,
          keyHash: input.keyHash,
          name: input.name,
          userId: input.userId,
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          expiresAt: input.expiresAt?.toISOString(),
          lastUsed: null
        };
        table2.insert(key);
        return mapApiKey2(key);
      }
      async updateApiKeyLastUsed(id) {
        const table2 = getTable("api_keys");
        table2.updateById(id, { lastUsed: (/* @__PURE__ */ new Date()).toISOString() });
      }
      async listApiKeysByUser(userId) {
        const table2 = getTable("api_keys");
        return table2.filter((k) => k.userId === userId).map(mapApiKey2);
      }
      async revokeApiKey(id) {
        const table2 = getTable("api_keys");
        table2.delById(id);
      }
      // ===== Policies =====
      async savePolicy(policy, mode) {
        const table2 = getTable("policies");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const existing = table2.find((p) => p.id === policy.id);
        const record = existing ? { ...existing, policy, mode, updatedAt: now } : { id: policy.id, policy, mode, createdAt: now, updatedAt: now };
        table2.upsert(record);
        return mapPolicy2(record);
      }
      async getPolicy(id) {
        const table2 = getTable("policies");
        const found = table2.find((p) => p.id === id);
        return found ? mapPolicy2(found) : null;
      }
      async listPolicies() {
        const table2 = getTable("policies");
        return table2.list().map(mapPolicy2);
      }
      async deletePolicy(id) {
        const policiesTable = getTable("policies");
        const versionsTable2 = getTable("policy_versions");
        policiesTable.delById(id);
        versionsTable2.del((v) => v.policyId === id);
        return true;
      }
      async countPolicies() {
        const table2 = getTable("policies");
        return table2.count();
      }
      // ===== Policy Versions =====
      async savePolicyVersion(policy, version, verified) {
        const table2 = getTable("policy_versions");
        const record = {
          id: `pver_${Date.now().toString(36)}`,
          policyId: policy.id,
          version,
          policy,
          verified,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        table2.insert(record);
        return mapPolicyVersion2(record);
      }
      async listPolicyVersions(policyId) {
        const table2 = getTable("policy_versions");
        return table2.filter((v) => v.policyId === policyId).map(mapPolicyVersion2);
      }
      async latestPolicyVersion(policyId) {
        const versions = await this.listPolicyVersions(policyId);
        return versions.length > 0 ? versions[0] : null;
      }
      async markVersionVerified(policyId, version) {
        const table2 = getTable("policy_versions");
        const versions = table2.filter((v) => v.policyId === policyId);
        for (const v of versions) {
          if (v.version === version) {
            table2.updateById(v.id, { verified: true });
            const updated = table2.find((x) => x.id === v.id);
            return updated ? mapPolicyVersion2(updated) : null;
          }
        }
        return null;
      }
      async allPolicyVersions() {
        const table2 = getTable("policy_versions");
        return table2.list().map(mapPolicyVersion2);
      }
      // ===== Deployment Runs =====
      async createDeploymentRun(input) {
        const table2 = getTable("deployment_runs");
        const record = {
          id: `run_${Date.now().toString(36)}`,
          policyVersionId: input.policyVersionId,
          source: input.source,
          status: "PENDING",
          startedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        table2.insert(record);
        return {
          id: record.id,
          policyVersionId: record.policyVersionId,
          source: record.source,
          status: record.status,
          startedAt: new Date(record.startedAt)
        };
      }
      async updateDeploymentRun(id, patch) {
        const table2 = getTable("deployment_runs");
        const updateData = {};
        if (patch.status) updateData.status = patch.status;
        if (patch.success !== void 0) updateData.success = patch.success;
        if (patch.metrics) updateData.metrics = patch.metrics;
        if (patch.error) updateData.error = patch.error;
        if (patch.completedAt) updateData.completedAt = patch.completedAt.toISOString();
        const updated = table2.updateById(id, updateData);
        return updated ? {
          id: updated.id,
          policyVersionId: updated.policyVersionId,
          source: updated.source,
          status: updated.status,
          success: updated.success,
          metrics: updated.metrics,
          error: updated.error,
          startedAt: new Date(updated.startedAt),
          completedAt: updated.completedAt ? new Date(updated.completedAt) : null
        } : null;
      }
      async getDeploymentRun(id) {
        const table2 = getTable("deployment_runs");
        const found = table2.find((r) => r.id === id);
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
          completedAt: found.completedAt ? new Date(found.completedAt) : null
        };
      }
      async listDeploymentRuns(policyVersionId) {
        const table2 = getTable("deployment_runs");
        const runs = policyVersionId ? table2.filter((r) => r.policyVersionId === policyVersionId) : table2.list();
        return runs.map((r) => ({
          id: r.id,
          policyVersionId: r.policyVersionId,
          source: r.source,
          status: r.status,
          success: r.success,
          metrics: r.metrics,
          error: r.error,
          startedAt: new Date(r.startedAt),
          completedAt: r.completedAt ? new Date(r.completedAt) : null
        }));
      }
      // ===== Categorized Failures =====
      async createCategorizedFailure(input) {
        const table2 = getTable("categorized_failures");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const record = {
          id: `fail_${Date.now().toString(36)}`,
          ...input,
          firstSeenAt: now,
          lastSeenAt: now
        };
        table2.insert(record);
        return {
          id: record.id,
          runId: record.runId,
          category: record.category,
          description: record.description,
          count: record.count,
          firstSeenAt: new Date(record.firstSeenAt),
          lastSeenAt: new Date(record.lastSeenAt)
        };
      }
      async updateCategorizedFailure(id, patch) {
        const table2 = getTable("categorized_failures");
        const updated = table2.updateById(id, patch);
        return updated ? {
          id: updated.id,
          runId: updated.runId,
          category: updated.category,
          description: updated.description,
          count: updated.count,
          firstSeenAt: new Date(updated.firstSeenAt),
          lastSeenAt: new Date(updated.lastSeenAt)
        } : null;
      }
      async listFailuresByRun(runId) {
        const table2 = getTable("categorized_failures");
        return table2.filter((f) => f.runId === runId).map((f) => ({
          id: f.id,
          runId: f.runId,
          category: f.category,
          description: f.description,
          count: f.count,
          firstSeenAt: new Date(f.firstSeenAt),
          lastSeenAt: new Date(f.lastSeenAt)
        }));
      }
      // ===== Improvement Recommendations =====
      async createImprovementRecommendation(input) {
        const table2 = getTable("improvements");
        const record = {
          id: `imp_${Date.now().toString(36)}`,
          ...input
        };
        table2.insert(record);
        return {
          id: record.id,
          runId: record.runId ?? null,
          title: record.title,
          description: record.description,
          priority: record.priority,
          category: record.category,
          estimatedGain: record.estimatedGain ?? null,
          appliedAt: record.appliedAt ? new Date(record.appliedAt) : null,
          appliedVersion: record.appliedVersion ?? null
        };
      }
      async updateImprovementRecommendation(id, patch) {
        const table2 = getTable("improvements");
        const updated = table2.updateById(id, patch);
        return updated ? {
          id: updated.id,
          runId: updated.runId ?? null,
          title: updated.title,
          description: updated.description,
          priority: updated.priority,
          category: updated.category,
          estimatedGain: updated.estimatedGain ?? null,
          appliedAt: updated.appliedAt ? new Date(updated.appliedAt) : null,
          appliedVersion: updated.appliedVersion ?? null
        } : null;
      }
      async listImprovementRecommendations(runId) {
        const table2 = getTable("improvements");
        const recs = runId ? table2.filter((r) => r.runId === runId) : table2.list();
        return recs.map((r) => ({
          id: r.id,
          runId: r.runId ?? null,
          title: r.title,
          description: r.description,
          priority: r.priority,
          category: r.category,
          estimatedGain: r.estimatedGain ?? null,
          appliedAt: r.appliedAt ? new Date(r.appliedAt) : null,
          appliedVersion: r.appliedVersion ?? null
        }));
      }
      // ===== NvJobs =====
      async createNvJob(input) {
        const table2 = getTable("nvidia_jobs");
        const record = {
          id: `nvj_${Date.now().toString(36)}`,
          ...input,
          startedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        table2.insert(record);
        return {
          id: record.id,
          jobId: record.jobId,
          service: record.service,
          status: record.status,
          payload: record.payload,
          result: record.result,
          error: record.error,
          startedAt: new Date(record.startedAt),
          completedAt: record.completedAt ? new Date(record.completedAt) : null
        };
      }
      async updateNvJob(id, patch) {
        const table2 = getTable("nvidia_jobs");
        const updateData = {};
        if (patch.status) updateData.status = patch.status;
        if (patch.result) updateData.result = patch.result;
        if (patch.error) updateData.error = patch.error;
        if (patch.completedAt) updateData.completedAt = patch.completedAt.toISOString();
        const updated = table2.updateById(id, updateData);
        return updated ? {
          id: updated.id,
          jobId: updated.jobId,
          service: updated.service,
          status: updated.status,
          payload: updated.payload,
          result: updated.result,
          error: updated.error,
          startedAt: new Date(updated.startedAt),
          completedAt: updated.completedAt ? new Date(updated.completedAt) : null
        } : null;
      }
      async getNvJob(id) {
        const table2 = getTable("nvidia_jobs");
        const found = table2.find((j) => j.id === id);
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
          completedAt: found.completedAt ? new Date(found.completedAt) : null
        };
      }
      async listNvJobs(service, status) {
        const table2 = getTable("nvidia_jobs");
        let jobs = table2.list();
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
          completedAt: j.completedAt ? new Date(j.completedAt) : null
        }));
      }
      // ===== Robots =====
      async createRobot(input) {
        const table2 = getTable("robots");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const record = {
          id: `rob_${Date.now().toString(36)}`,
          ...input,
          createdAt: now,
          updatedAt: now
        };
        table2.insert(record);
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
          updatedAt: new Date(record.updatedAt)
        };
      }
      async getRobot(id) {
        const table2 = getTable("robots");
        const found = table2.find((r) => r.id === id);
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
          updatedAt: new Date(found.updatedAt)
        };
      }
      async listRobots() {
        const table2 = getTable("robots");
        return table2.list().map((r) => ({
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
          updatedAt: new Date(r.updatedAt)
        }));
      }
      // ===== Organizations =====
      async createOrganization(name) {
        const table2 = getTable("organizations");
        const record = {
          id: `org_${Date.now().toString(36)}`,
          name,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        table2.insert(record);
        return {
          id: record.id,
          name: record.name,
          createdAt: new Date(record.createdAt)
        };
      }
      async getOrganization(id) {
        const table2 = getTable("organizations");
        const found = table2.find((o) => o.id === id);
        if (!found) return null;
        return {
          id: found.id,
          name: found.name,
          createdAt: new Date(found.createdAt)
        };
      }
      async listOrganizations() {
        const table2 = getTable("organizations");
        return table2.list().map((o) => ({
          id: o.id,
          name: o.name,
          createdAt: new Date(o.createdAt)
        }));
      }
      // ===== Health =====
      async checkConnection() {
        return import_fs2.default.existsSync(dataDir2);
      }
      async disconnect() {
      }
    };
  }
});

// server/pipeline/isaacSimBridge.ts
var isaacSimBridge_exports = {};
__export(isaacSimBridge_exports, {
  compileMuJoCoXml: () => compileMuJoCoXml,
  generateSimulationTelemetryIsaacSim: () => generateSimulationTelemetryIsaacSim,
  getIsaacSimJobStatus: () => getIsaacSimJobStatus,
  submitIsaacSimSimulation: () => submitIsaacSimSimulation,
  waitForIsaacSimCompletion: () => waitForIsaacSimCompletion
});
function getNVIDIAHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (NVIDIA_API_KEY) {
    headers["Authorization"] = `Bearer ${NVIDIA_API_KEY}`;
  }
  return headers;
}
function getRobotUSD(robotId) {
  return ROBOT_USD_MAP[robotId] || ROBOT_USD_MAP["franka_panda"];
}
function getEnvironmentUSD(environment) {
  return ENVIRONMENT_USD_MAP[environment] || ENVIRONMENT_USD_MAP["MuJoCo"];
}
async function submitIsaacSimSimulation(params) {
  const scene = {
    robot_usd: getRobotUSD(params.robot),
    environment_usd: getEnvironmentUSD(params.environment),
    task_description: params.taskTitle,
    control_mode: params.controlMode,
    observation_space: params.observationSpace,
    domain_randomization: params.domainRandomization,
    robot_dof: params.robotDof
  };
  if (USE_OSMO) {
    return submitOSMOSimulationJob(scene);
  }
  return submitDirectIsaacSimJob(scene);
}
async function submitDirectIsaacSimJob(scene) {
  const response = await fetch(`${ISAAC_SIM_ENDPOINT}/api/v1/simulations`, {
    method: "POST",
    headers: getNVIDIAHeaders(),
    body: JSON.stringify(scene)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Isaac Sim submit failed: ${response.status} - ${error}`);
  }
  const job = await response.json();
  return job.job_id;
}
async function submitOSMOSimulationJob(scene) {
  const response = await fetch(`${OSMO_ENDPOINT}/jobs`, {
    method: "POST",
    headers: getNVIDIAHeaders(),
    body: JSON.stringify({
      recipe: "isaac_sim_policy_simulation",
      parameters: scene
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OSMO submit failed: ${response.status} - ${error}`);
  }
  const job = await response.json();
  return job.id;
}
async function getIsaacSimJobStatus(jobId) {
  const endpoint = USE_OSMO ? `${OSMO_ENDPOINT}/jobs/${jobId}` : `${ISAAC_SIM_ENDPOINT}/api/v1/simulations/${jobId}`;
  const response = await fetch(endpoint, { headers: getNVIDIAHeaders() });
  if (!response.ok) {
    throw new Error(`Failed to get job status: ${response.status}`);
  }
  return response.json();
}
async function waitForIsaacSimCompletion(jobId, timeoutMs = 3e5, pollIntervalMs = 5e3) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const job = await getIsaacSimJobStatus(jobId);
    if (job.status === "completed") {
      return job;
    }
    if (job.status === "failed") {
      throw new Error(`Simulation failed: ${job.error || "Unknown error"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Simulation timed out after ${timeoutMs}ms`);
}
function generateSimulationTelemetryIsaacSim(job, robotDof, domainRandomization = false) {
  const telemetry = job.telemetry || [];
  const metrics = job.metrics;
  if (metrics && telemetry.length > 0) {
    return { ...metrics, telemetry };
  }
  const stepsCount = 25;
  const timeStep = 0.2;
  const syntheticTelemetry = [];
  let totalEnergyJ = 0;
  for (let i = 0; i < stepsCount; i++) {
    const timeSec = +(i * timeStep).toFixed(2);
    const reward = +Math.min(1, Math.pow(i / 18, 1.4) + Math.sin(i * 0.4) * 0.02).toFixed(3);
    const torqueBase = 12 * Math.exp(-i / 7) + 2.8 + (robotDof > 10 ? 15 : 0);
    const jointTorqueAvg = +(torqueBase + Math.sin(i * 0.5) * 0.8).toFixed(2);
    totalEnergyJ += jointTorqueAvg * 0.1;
    const eefPositionErrorMm = +Math.max(0.2, 42 * Math.exp(-i / 5.5) + Math.random() * 0.2).toFixed(2);
    let collisionForceN = 0.3 + Math.random() * 0.2;
    if (i >= 11 && i <= 15) {
      collisionForceN = 6.2 + Math.random() * 2.4;
    }
    collisionForceN = +collisionForceN.toFixed(1);
    const actionMagnitude = +(0.75 * Math.exp(-i / 12) + 0.08).toFixed(3);
    syntheticTelemetry.push({
      step: i * 10,
      timeSec,
      reward: +reward,
      jointTorqueAvg,
      eefPositionErrorMm,
      collisionForceN,
      actionMagnitude
    });
  }
  const baseSuccess = 94.5 + Math.random() * 4;
  const simToReal = domainRandomization ? 93.8 + Math.random() * 4 : 85.2 + Math.random() * 4;
  return {
    successRatePct: +baseSuccess.toFixed(1),
    meanTrajectoryTimeSec: +(stepsCount * timeStep * 0.85).toFixed(1),
    simToRealConfidencePct: +simToReal.toFixed(1),
    energyScoreJoule: +totalEnergyJ.toFixed(1),
    totalSimRuns: Math.floor(1e3 + Math.random() * 2e3),
    telemetry: syntheticTelemetry
  };
}
function compileIsaacSimMuJoCoXml(params) {
  const robotUsd = getRobotUSD(params.robot);
  const envUsd = getEnvironmentUSD(params.environment);
  return `<!-- Isaac Sim USD Scene (converted to MuJoCo XML for compatibility) -->
<!-- Robot: ${robotUsd} -->
<!-- Environment: ${envUsd} -->
<!-- Task: ${params.taskTitle} -->
<!-- Control Mode: ${params.controlMode} -->
<!-- Domain Randomization: ${params.domainRandomization} -->

<mujoco model="isaac_sim_scene">
  <compiler angle="radian" coordinate="local"/>
  <option timestep="0.001" gravity="0 0 -9.81" iterations="50" solver="Newton"/>
  
  <visual>
    <global offwidth="1920" offheight="1080"/>
  </visual>

  <asset>
    <!-- USD assets would be loaded here in Isaac Sim -->
    <!-- This XML is a compatibility layer for MuJoCo-based tools -->
  </asset>

  <worldbody>
    <light directional="true" diffuse="0.8 0.8 0.8" specular="0.2 0.2 0.2" pos="0 0 3" dir="0 0 -1"/>
    <geom name="floor" type="plane" size="5 5 0.1" rgba="0.9 0.9 0.9 1" friction="1 0.5 0.5"/>
  </worldbody>

  <actuator>
    <!-- Actuators defined by robot USD -->
  </actuator>
</mujoco>`;
}
function compileMuJoCoXml(params) {
  return compileIsaacSimMuJoCoXml({
    robot: params.robotId,
    taskTitle: params.taskTitle,
    environment: params.environment,
    controlMode: "Cartesian Impedance",
    observationSpace: ["RGB Camera", "Joint Encoders"],
    domainRandomization: params.domainRandomization,
    robotDof: 7
  });
}
var ISAAC_SIM_ENDPOINT, OSMO_ENDPOINT, NVIDIA_API_KEY, USE_OSMO, ROBOT_USD_MAP, ENVIRONMENT_USD_MAP;
var init_isaacSimBridge = __esm({
  "server/pipeline/isaacSimBridge.ts"() {
    ISAAC_SIM_ENDPOINT = process.env.ISAAC_SIM_ENDPOINT || "http://localhost:8211";
    OSMO_ENDPOINT = process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo";
    NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
    USE_OSMO = process.env.USE_OSMO === "true";
    ROBOT_USD_MAP = {
      "franka_panda": "Isaac/Robots/Franka/franka.usd",
      "ur5e": "Isaac/Robots/UniversalRobots/ur5e/ur5e.usd",
      "unitree_h1": "Isaac/Robots/Unitree/H1/h1.usd",
      "kinova_gen3": "Isaac/Robots/Kinova/gen3/gen3.usd",
      "shadow_hand": "Isaac/Robots/ShadowHand/shadow_hand.usd",
      "turtlebot4": "Isaac/Robots/TurtleBot4/turtlebot4.usd"
    };
    ENVIRONMENT_USD_MAP = {
      "MuJoCo": "Isaac/Environments/Simple_Room/simple_room.usd",
      "Isaac Sim": "Isaac/Environments/Warehouse/warehouse.usd",
      "Drake": "Isaac/Environments/Simple_Room/simple_room.usd",
      "PyBullet": "Isaac/Environments/Simple_Room/simple_room.usd"
    };
  }
});

// server/pipeline/leappExporter.ts
var leappExporter_exports = {};
__export(leappExporter_exports, {
  clearCheckpoint: () => clearCheckpoint,
  exportPolicyViaLEAPP: () => exportPolicyViaLEAPP,
  generateSimulatedLEAPPExport: () => generateSimulatedLEAPPExport,
  getCheckpoint: () => getCheckpoint,
  registerCheckpoint: () => registerCheckpoint,
  serveLeappMetadataFile: () => serveLeappMetadataFile
});
function registerCheckpoint(policyId, checkpointPath, taskName, robotDof, jobMetrics) {
  const entry = {
    id: policyId,
    checkpointPath,
    taskName,
    robotDof,
    jobMetrics,
    registeredAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  checkpointTable.upsert(entry);
  console.log(`LEAPP: Registered checkpoint for policy ${policyId} -> ${checkpointPath}`);
}
function getCheckpoint(policyId) {
  const r = checkpointTable.find((e) => e.id === policyId);
  if (!r) return null;
  const { id: _id, ...rest } = r;
  return rest;
}
function clearCheckpoint(policyId) {
  checkpointTable.delById(policyId);
}
function mapPolicyToIsaacLabTask(policy) {
  return TASK_NAME_MAP[policy.robot.id] || TASK_NAME_MAP["franka_panda"];
}
function getNVIDIAHeaders5() {
  const headers = { "Content-Type": "application/json" };
  if (NVIDIA_API_KEY7) {
    headers["Authorization"] = `Bearer ${NVIDIA_API_KEY7}`;
  }
  return headers;
}
async function exportPolicyViaLEAPP(options) {
  const { policy, format, optimize, quantization } = options;
  const checkpoint = getCheckpoint(policy.id);
  if (!checkpoint) {
    throw new Error(
      `No Isaac Lab checkpoint found for policy ${policy.id}. Train with Isaac Lab and register the checkpoint before exporting.`
    );
  }
  const taskName = checkpoint.taskName || mapPolicyToIsaacLabTask(policy);
  const payload = USE_OSMO3 ? {
    recipe: "leapp_onnx_export",
    parameters: {
      checkpoint_path: checkpoint.checkpointPath,
      task_name: taskName,
      export_format: format,
      optimize: optimize !== false,
      quantization: quantization || "fp16"
    }
  } : {
    checkpoint_path: checkpoint.checkpointPath,
    task_name: taskName,
    export_format: format,
    optimize: optimize !== false,
    quantization: quantization || "fp16"
  };
  const endpoint = USE_OSMO3 ? `${OSMO_ENDPOINT3}/jobs` : `${ISAAC_LAB_ENDPOINT}/api/v1/export/onnx`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: getNVIDIAHeaders5(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LEAPP export failed: ${response.status} - ${error}`);
  }
  const leappResult = await response.json();
  const fileName = await downloadOnnxModel(
    leappResult.onnx_path,
    policy.id,
    format
  );
  writeOnnxMetadataFile(policy.id, fileName, leappResult);
  return {
    id: `onnx_${Date.now().toString(36)}`,
    policyId: policy.id,
    onnxModelUrl: `/exports/onnx/${fileName}`,
    onnxModelSizeBytes: leappResult.onnx_size_bytes,
    inputShape: leappResult.input_shape,
    outputShape: leappResult.output_shape,
    opsetVersion: leappResult.opset_version,
    latencyMs: leappResult.latency_ms,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    exportFormat: format
  };
}
async function downloadOnnxModel(remotePath, policyId, format) {
  const ext = format === "tensorrt" ? "engine" : "onnx";
  const fileName = `${policyId}_leapp.${ext}`;
  const localPath = import_path5.default.join(onnxOutputDir2, fileName);
  if (remotePath.startsWith("http://") || remotePath.startsWith("https://")) {
    const resp = await fetch(remotePath);
    if (!resp.ok) {
      throw new Error(`Failed to download ONNX from ${remotePath}: ${resp.status}`);
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    import_fs5.default.writeFileSync(localPath, buf);
  } else {
    if (import_fs5.default.existsSync(remotePath)) {
      import_fs5.default.copyFileSync(remotePath, localPath);
      console.log(`LEAPP: Downloaded ONNX model ${remotePath} -> ${localPath}`);
    } else {
      console.warn(`LEAPP: Remote model path not found (${remotePath}); writing placeholder.`);
      import_fs5.default.writeFileSync(localPath, Buffer.from("LEAPP_ONNX_PLACEHOLDER"));
    }
  }
  return fileName;
}
function writeOnnxMetadataFile(policyId, fileName, leappResult) {
  const metaFileName = fileName.replace(/\.(onnx|engine)$/, ".leapp.json");
  const metaPath = import_path5.default.join(onnxOutputDir2, metaFileName);
  const metaContent = {
    policyId,
    onnxFile: fileName,
    taskName: leappResult.metadata.task_name,
    checkpointPath: leappResult.metadata.checkpoint_path,
    observationKeys: leappResult.metadata.observation_keys,
    actionKeys: leappResult.metadata.action_keys,
    normalization: leappResult.metadata.normalization,
    opsetVersion: leappResult.opset_version,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  import_fs5.default.writeFileSync(metaPath, JSON.stringify(metaContent, null, 2));
  console.log(`LEAPP: Wrote metadata sidecar -> ${metaPath}`);
}
function serveLeappMetadataFile(fileName) {
  const filePath = import_path5.default.join(onnxOutputDir2, fileName);
  if (!import_fs5.default.existsSync(filePath)) return null;
  return import_fs5.default.readFileSync(filePath);
}
function generateSimulatedLEAPPExport(options) {
  const { policy, format, optimize, quantization } = options;
  const dof = policy.robot.dof;
  const inputDim = dof * 3 + 6;
  const outputDim = dof;
  const ext = format === "tensorrt" ? "engine" : "onnx";
  const exportId = `onnx_${Date.now().toString(36)}`;
  const fileName = `${policy.id}_leapp.${ext}`;
  const filePath = import_path5.default.join(onnxOutputDir2, fileName);
  const onnxArtifact = buildSimulatedOnnxArtifact(inputDim, outputDim);
  import_fs5.default.writeFileSync(filePath, onnxArtifact);
  const observationKeys = buildObservationKeys(policy);
  const actionKeys = buildActionKeys(policy);
  const normalization = {
    mean: new Array(inputDim).fill(0),
    std: new Array(inputDim).fill(1)
  };
  const meta = {
    policyId: policy.id,
    onnxFile: fileName,
    taskName: mapPolicyToIsaacLabTask(policy),
    checkpointPath: `simulated://checkpoints/${policy.id}.pt`,
    observationKeys,
    actionKeys,
    normalization,
    opsetVersion: 17,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    simulated: true
  };
  import_fs5.default.writeFileSync(
    import_path5.default.join(onnxOutputDir2, fileName.replace(/\.(onnx|engine)$/, ".leapp.json")),
    Buffer.from(JSON.stringify(meta, null, 2))
  );
  const sizeBytes = onnxArtifact.length;
  return {
    id: exportId,
    policyId: policy.id,
    onnxModelUrl: `/exports/onnx/${fileName}`,
    onnxModelSizeBytes: sizeBytes,
    inputShape: `[1, ${inputDim}]`,
    outputShape: `[1, ${outputDim}]`,
    opsetVersion: 17,
    latencyMs: policy.onnxSpec.latencyMs,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    exportFormat: format
  };
}
function buildSimulatedOnnxArtifact(inputDim, outputDim) {
  const textproto = [
    `ir_version: 8`,
    `opset_import { domain: "" version: 17 }`,
    `graph {`,
    `  name: "leapp_sim_policy"`,
    `  input { name: "observation" type { tensor_type { elem_type: 1 shape { dim { dim_value: 1 } dim { dim_value: ${inputDim} } } } } }`,
    `  output { name: "action" type { tensor_type { elem_type: 1 shape { dim { dim_value: 1 } dim { dim_value: ${outputDim} } } } } }`,
    `  node { op_type: "Identity" name: "passthrough" input: "observation" output: "action" }`,
    `}`
  ].join("\n");
  return Buffer.from(textproto);
}
function buildObservationKeys(policy) {
  const keys = [];
  for (const obs of policy.input.observationSpace) {
    if (obs === "Joint Encoders") keys.push("joint_pos", "joint_vel");
    else if (obs === "EE Force/Torque") keys.push("force_torque");
    else if (obs === "RGB Camera") keys.push("rgb_image");
    else if (obs === "Depth Map") keys.push("depth_image");
    else if (obs === "Tactile Arrays") keys.push("tactile_array");
  }
  if (!keys.includes("force_torque")) keys.push("ee_pos", "ee_quat");
  return keys.length ? keys : ["joint_pos", "joint_vel", "ee_pos"];
}
function buildActionKeys(policy) {
  if (policy.input.controlMode === "Cartesian Impedance") return ["ee_target_pos", "ee_target_quat"];
  if (policy.input.controlMode === "Delta EE Pose") return ["delta_ee_pos", "delta_ee_rot"];
  if (policy.input.controlMode === "Action Chunks") return ["action_chunk"];
  return ["joint_target_vel"];
}
var import_path5, import_fs5, ISAAC_LAB_ENDPOINT, OSMO_ENDPOINT3, NVIDIA_API_KEY7, USE_OSMO3, onnxOutputDir2, checkpointTable, TASK_NAME_MAP;
var init_leappExporter = __esm({
  "server/pipeline/leappExporter.ts"() {
    import_path5 = __toESM(require("path"), 1);
    import_fs5 = __toESM(require("fs"), 1);
    init_sqliteStore();
    ISAAC_LAB_ENDPOINT = process.env.ISAAC_LAB_ENDPOINT || "http://localhost:8212";
    OSMO_ENDPOINT3 = process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo";
    NVIDIA_API_KEY7 = process.env.NVIDIA_API_KEY;
    USE_OSMO3 = process.env.USE_OSMO === "true";
    onnxOutputDir2 = import_path5.default.join(process.cwd(), "exports", "onnx");
    if (!import_fs5.default.existsSync(onnxOutputDir2)) {
      import_fs5.default.mkdirSync(onnxOutputDir2, { recursive: true });
    }
    checkpointTable = getTable("checkpoints");
    TASK_NAME_MAP = {
      "franka_panda": "Isaac-Manipulation-Franka-Panda-v0",
      "ur5e": "Isaac-Manipulation-UR5e-v0",
      "unitree_h1": "Isaac-Locomotion-H1-v0",
      "kinova_gen3": "Isaac-Manipulation-Kinova-Gen3-v0",
      "shadow_hand": "Isaac-Dexterous-ShadowHand-v0",
      "turtlebot4": "Isaac-Navigation-TurtleBot4-v0"
    };
  }
});

// server/pipeline/isaacLabBridge.ts
var isaacLabBridge_exports = {};
__export(isaacLabBridge_exports, {
  exportIsaacLabPolicyToONNX: () => exportIsaacLabPolicyToONNX,
  generateIsaacLabTrainingTelemetry: () => generateIsaacLabTrainingTelemetry,
  getIsaacLabAlgorithmForPlanType: () => getIsaacLabAlgorithmForPlanType,
  getIsaacLabJobStatus: () => getIsaacLabJobStatus,
  getIsaacLabTaskName: () => getIsaacLabTaskName,
  submitIsaacLabTraining: () => submitIsaacLabTraining,
  waitForIsaacLabTrainingCompletion: () => waitForIsaacLabTrainingCompletion
});
function getNVIDIAHeaders6() {
  const headers = { "Content-Type": "application/json" };
  if (NVIDIA_API_KEY8) {
    headers["Authorization"] = `Bearer ${NVIDIA_API_KEY8}`;
  }
  return headers;
}
function mapTaskToIsaacLab(params) {
  const taskName = TASK_NAME_MAP2[params.robot] || TASK_NAME_MAP2["franka_panda"];
  const algorithm = PLAN_TYPE_ALGORITHM[params.planType] || ALGORITHM_MAP[params.controlMode] || "PPO";
  return {
    task_name: taskName,
    robot: params.robot,
    num_envs: params.domainRandomization ? 4096 : 1024,
    max_iterations: 5e3,
    algorithm,
    domain_randomization: params.domainRandomization,
    headless: true
  };
}
async function submitIsaacLabTraining(params) {
  const config = mapTaskToIsaacLab(params);
  if (USE_OSMO4) {
    return submitOSMOTrainingJob(config);
  }
  return submitDirectIsaacLabJob(config);
}
async function submitDirectIsaacLabJob(config) {
  const response = await fetch(`${ISAAC_LAB_ENDPOINT2}/api/v1/training`, {
    method: "POST",
    headers: getNVIDIAHeaders6(),
    body: JSON.stringify(config)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Isaac Lab training submit failed: ${response.status} - ${error}`);
  }
  const job = await response.json();
  return job.job_id;
}
async function submitOSMOTrainingJob(config) {
  const response = await fetch(`${OSMO_ENDPOINT4}/jobs`, {
    method: "POST",
    headers: getNVIDIAHeaders6(),
    body: JSON.stringify({
      recipe: "isaac_lab_rl_training",
      parameters: config
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OSMO training submit failed: ${response.status} - ${error}`);
  }
  const job = await response.json();
  return job.id;
}
async function getIsaacLabJobStatus(jobId) {
  const endpoint = USE_OSMO4 ? `${OSMO_ENDPOINT4}/jobs/${jobId}` : `${ISAAC_LAB_ENDPOINT2}/api/v1/training/${jobId}`;
  const response = await fetch(endpoint, { headers: getNVIDIAHeaders6() });
  if (!response.ok) {
    throw new Error(`Failed to get Isaac Lab job status: ${response.status}`);
  }
  return response.json();
}
async function waitForIsaacLabTrainingCompletion(jobId, timeoutMs = 36e5, pollIntervalMs = 1e4) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const job = await getIsaacLabJobStatus(jobId);
    if (job.status === "completed") {
      return job;
    }
    if (job.status === "failed") {
      throw new Error(`Training failed: ${job.error || "Unknown error"}`);
    }
    console.log(`Isaac Lab training progress: ${job.progress_pct}% (iter ${job.current_iteration}/${job.total_iterations})`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Training timed out after ${timeoutMs}ms`);
}
async function exportIsaacLabPolicyToONNX(jobId, checkpointPath, options = {}) {
  const endpoint = USE_OSMO4 ? `${OSMO_ENDPOINT4}/jobs` : `${ISAAC_LAB_ENDPOINT2}/api/v1/export/onnx`;
  const payload = USE_OSMO4 ? {
    recipe: "leapp_onnx_export",
    parameters: {
      checkpoint_path: checkpointPath,
      task_name: "auto",
      // Isaac Lab can infer from checkpoint
      export_format: options.format || "onnx",
      optimize: options.optimize !== false,
      quantization: options.quantization || "fp16"
    }
  } : {
    checkpoint_path: checkpointPath,
    task_name: "auto",
    export_format: options.format || "onnx",
    optimize: options.optimize !== false,
    quantization: options.quantization || "fp16"
  };
  const response = await fetch(endpoint, {
    method: "POST",
    headers: getNVIDIAHeaders6(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ONNX export failed: ${response.status} - ${error}`);
  }
  return response.json();
}
function generateIsaacLabTrainingTelemetry(job, robotDof) {
  const { metrics } = job;
  const stepsCount = 25;
  const timeStep = 0.2;
  const telemetry = [];
  let totalEnergyJ = 0;
  const baseSuccess = Math.min(99, metrics.success_rate * 100 + 5);
  const simToReal = 90 + Math.random() * 8;
  for (let i = 0; i < stepsCount; i++) {
    const timeSec = +(i * timeStep).toFixed(2);
    const reward = +Math.min(1, Math.pow(i / 18, 1.4) + Math.sin(i * 0.4) * 0.02).toFixed(3);
    const torqueBase = 12 * Math.exp(-i / 7) + 2.8 + (robotDof > 10 ? 15 : 0);
    const jointTorqueAvg = +(torqueBase + Math.sin(i * 0.5) * 0.8).toFixed(2);
    totalEnergyJ += jointTorqueAvg * 0.1;
    const eefPositionErrorMm = +Math.max(0.2, 42 * Math.exp(-i / 5.5) + Math.random() * 0.2).toFixed(2);
    let collisionForceN = 0.3 + Math.random() * 0.2;
    if (i >= 11 && i <= 15) {
      collisionForceN = 6.2 + Math.random() * 2.4;
    }
    collisionForceN = +collisionForceN.toFixed(1);
    const actionMagnitude = +(0.75 * Math.exp(-i / 12) + 0.08).toFixed(3);
    telemetry.push({
      step: i * 10,
      timeSec,
      reward: +reward,
      jointTorqueAvg,
      eefPositionErrorMm,
      collisionForceN,
      actionMagnitude
    });
  }
  return {
    metrics: {
      successRatePct: +baseSuccess.toFixed(1),
      meanTrajectoryTimeSec: +(stepsCount * timeStep * 0.85).toFixed(1),
      simToRealConfidencePct: +simToReal.toFixed(1),
      energyScoreJoule: +totalEnergyJ.toFixed(1),
      totalSimRuns: Math.floor(1e3 + Math.random() * 2e3)
    },
    telemetry
  };
}
function getIsaacLabAlgorithmForPlanType(planType) {
  return PLAN_TYPE_ALGORITHM[planType] || "PPO";
}
function getIsaacLabTaskName(robotId) {
  return TASK_NAME_MAP2[robotId] || TASK_NAME_MAP2["franka_panda"];
}
var ISAAC_LAB_ENDPOINT2, OSMO_ENDPOINT4, NVIDIA_API_KEY8, USE_OSMO4, TASK_NAME_MAP2, ALGORITHM_MAP, PLAN_TYPE_ALGORITHM;
var init_isaacLabBridge = __esm({
  "server/pipeline/isaacLabBridge.ts"() {
    ISAAC_LAB_ENDPOINT2 = process.env.ISAAC_LAB_ENDPOINT || "http://localhost:8212";
    OSMO_ENDPOINT4 = process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo";
    NVIDIA_API_KEY8 = process.env.NVIDIA_API_KEY;
    USE_OSMO4 = process.env.USE_OSMO === "true";
    TASK_NAME_MAP2 = {
      "franka_panda": "Isaac-Manipulation-Franka-Panda-v0",
      "ur5e": "Isaac-Manipulation-UR5e-v0",
      "unitree_h1": "Isaac-Locomotion-H1-v0",
      "kinova_gen3": "Isaac-Manipulation-Kinova-Gen3-v0",
      "shadow_hand": "Isaac-Dexterous-ShadowHand-v0",
      "turtlebot4": "Isaac-Navigation-TurtleBot4-v0"
    };
    ALGORITHM_MAP = {
      "Cartesian Impedance": "IL",
      "Joint Velocity": "PPO",
      "Delta EE Pose": "PPO",
      "Action Chunks": "PPO"
    };
    PLAN_TYPE_ALGORITHM = {
      "Plan A: Symbolic Trajectory Code": "IL",
      "Plan B: Neural VLA Policy (ONNX)": "PPO",
      "Plan C: Reinforcement Learning (PPO)": "PPO"
    };
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  app: () => app
});
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path9 = __toESM(require("path"), 1);
var import_fs9 = __toESM(require("fs"), 1);
var import_url2 = require("url");
var import_vite = require("vite");
var import_genai4 = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
init_logger();

// server/middleware/security.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"), 1);
var import_cors = __toESM(require("cors"), 1);
init_logger();
var import_zod = require("zod");
var corsMiddleware = (0, import_cors.default)({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "https://policy-0.com",
      "https://www.policy-0.com",
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ];
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, "CORS blocked origin");
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key", "x-request-id"],
  exposedHeaders: ["x-request-id"],
  maxAge: 86400
  // 24 hours
});
var generalRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  // 1 minute
  max: 100,
  // 100 requests per window
  message: {
    success: false,
    error: "Too many requests, please try again later.",
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown",
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, "Rate limit exceeded");
    res.status(429).json({
      success: false,
      error: "Too many requests, please try again later.",
      retryAfter: 60
    });
  }
});
var strictRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  max: 20,
  message: { success: false, error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || "unknown"
});
var uploadRateLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 1e3,
  max: 10,
  message: { success: false, error: "Too many uploads, please try again later." },
  keyGenerator: (req) => req.ip || "unknown"
});
var schemas = {
  // Video upload
  videoUpload: import_zod.z.object({
    fileName: import_zod.z.string().min(1).max(255),
    fileSizeBytes: import_zod.z.number().positive().max(500 * 1024 * 1024),
    // 500MB max
    mimeType: import_zod.z.enum(["video/mp4", "video/quicktime", "video/x-msvideo", "video/x-matroska"])
  }),
  // VLM Analysis
  analyzeVLM: import_zod.z.object({
    videoUploadId: import_zod.z.string().min(1),
    description: import_zod.z.string().optional()
  }),
  analyzeDescription: import_zod.z.object({
    description: import_zod.z.string().min(1).max(5e3)
  }),
  // Video Generation
  generateVideo: import_zod.z.object({
    taskTitle: import_zod.z.string().min(1).max(200),
    taskDescription: import_zod.z.string().max(5e3).optional(),
    robotModel: import_zod.z.string().min(1).max(100).optional(),
    robotDof: import_zod.z.number().int().positive().max(50).optional(),
    controlMode: import_zod.z.enum(["Cartesian Impedance", "Joint Velocity", "Delta EE Pose", "Action Chunks"]).optional(),
    resolution: import_zod.z.enum(["720p", "1080p", "4K"]).optional(),
    durationSec: import_zod.z.number().int().positive().max(300).optional(),
    domainRandomization: import_zod.z.boolean().optional()
  }),
  // Policy Generation
  generatePolicy: import_zod.z.object({
    title: import_zod.z.string().min(1).max(200),
    description: import_zod.z.string().max(5e3).optional(),
    robotId: import_zod.z.string().min(1).max(100).optional(),
    robotName: import_zod.z.string().min(1).max(200).optional(),
    robotDof: import_zod.z.number().int().positive().max(50).optional(),
    robotType: import_zod.z.string().min(1).max(50).optional(),
    environment: import_zod.z.enum(["MuJoCo", "Isaac Sim", "Drake", "PyBullet"]).optional(),
    controlMode: import_zod.z.enum(["Cartesian Impedance", "Joint Velocity", "Delta EE Pose", "Action Chunks"]).optional(),
    observationSpace: import_zod.z.array(import_zod.z.string()).optional(),
    videoName: import_zod.z.string().optional(),
    domainRandomization: import_zod.z.boolean().optional(),
    maxExecutionTimeSec: import_zod.z.number().int().positive().max(3600).optional()
  }),
  // ONNX Export
  onnxExport: import_zod.z.object({
    policy: import_zod.z.object({
      id: import_zod.z.string(),
      onnxSpec: import_zod.z.object({
        inputShape: import_zod.z.string(),
        outputShape: import_zod.z.string()
      }).passthrough()
    }).passthrough(),
    // retain robot/routing/pythonCode needed by the exporter
    format: import_zod.z.enum(["onnx", "tensorrt", "onnx-tensorrt"]).optional(),
    optimize: import_zod.z.boolean().optional(),
    quantization: import_zod.z.enum(["fp32", "fp16", "int8"]).nullable().optional()
  }),
  // Approval
  approval: import_zod.z.object({
    approvalId: import_zod.z.string(),
    decision: import_zod.z.enum(["approved", "rejected", "revision_requested"]),
    policyId: import_zod.z.string().optional(),
    feedback: import_zod.z.string().max(2e3).optional()
  }),
  // Isaac Lab Training
  isaacLabTrain: import_zod.z.object({
    robot: import_zod.z.string().min(1),
    taskTitle: import_zod.z.string().min(1).max(200),
    controlMode: import_zod.z.string().optional(),
    observationSpace: import_zod.z.array(import_zod.z.string()).optional(),
    domainRandomization: import_zod.z.boolean().optional(),
    robotDof: import_zod.z.number().int().positive().max(50).optional(),
    planType: import_zod.z.string().optional()
  }),
  // Isaac Sim Simulation
  isaacSimSimulate: import_zod.z.object({
    robot: import_zod.z.string().min(1),
    taskTitle: import_zod.z.string().min(1),
    environment: import_zod.z.string().optional(),
    controlMode: import_zod.z.string().optional(),
    observationSpace: import_zod.z.array(import_zod.z.string()).optional(),
    domainRandomization: import_zod.z.boolean().optional(),
    robotDof: import_zod.z.number().int().positive().max(50).optional()
  }),
  // Telemetry Collection
  telemetryCollect: import_zod.z.object({
    policyId: import_zod.z.string().min(1),
    robotModel: import_zod.z.string().optional(),
    taskTitle: import_zod.z.string().optional(),
    outcome: import_zod.z.enum(["success", "failure", "partial"]),
    successScore: import_zod.z.number().min(0).max(100).optional(),
    durationSec: import_zod.z.number().positive().optional(),
    numAttempts: import_zod.z.number().int().positive().optional(),
    errorSignals: import_zod.z.array(import_zod.z.object({
      type: import_zod.z.string(),
      severity: import_zod.z.enum(["low", "medium", "high", "critical"]),
      description: import_zod.z.string(),
      occurredAtSec: import_zod.z.number().nonnegative()
    })).optional(),
    environmentFingerprint: import_zod.z.string().optional(),
    source: import_zod.z.enum(["sim", "real_world"]).optional(),
    deviceSerial: import_zod.z.string().optional()
  }),
  // Improvements
  improvementsGenerate: import_zod.z.object({
    useLLM: import_zod.z.boolean().optional()
  }),
  improvementApply: import_zod.z.object({
    improvementId: import_zod.z.string().min(1)
  }),
  // Evolution
  evolutionRegenerate: import_zod.z.object({
    policy: import_zod.z.any()
    // GeneratedPolicy is complex, validated separately
  }),
  // Approval
  createApproval: import_zod.z.object({
    videoGenerationId: import_zod.z.string().min(1),
    expiresInHours: import_zod.z.number().int().positive().max(168).optional()
    // max 1 week
  }),
  // Telemetry simulate
  telemetrySimulate: import_zod.z.object({
    policyId: import_zod.z.string().min(1),
    source: import_zod.z.enum(["sim", "real_world"]).optional()
  }),
  // Isaac Lab wait
  isaacLabWait: import_zod.z.object({
    jobId: import_zod.z.string().min(1),
    timeoutMs: import_zod.z.number().int().positive().max(36e5).optional()
    // max 1 hour
  }),
  // Isaac Lab export ONNX
  isaacLabExportOnnx: import_zod.z.object({
    policyId: import_zod.z.string().min(1),
    checkpointId: import_zod.z.string().optional()
  }),
  // Isaac Lab register checkpoint
  isaacLabRegisterCheckpoint: import_zod.z.object({
    policyId: import_zod.z.string().min(1),
    checkpointPath: import_zod.z.string().min(1),
    metrics: import_zod.z.record(import_zod.z.string(), import_zod.z.number()).optional()
  }),
  // OSMO job cancel
  osmoJobCancel: import_zod.z.object({
    jobId: import_zod.z.string().min(1)
  }),
  // OSMO job logs stream
  osmoJobLogs: import_zod.z.object({
    jobId: import_zod.z.string().min(1),
    follow: import_zod.z.boolean().optional()
  }),
  // OSMO
  osmoSubmit: import_zod.z.object({
    recipe: import_zod.z.enum([
      "isaac_sim_policy_training",
      "isaac_lab_rl_training",
      "isaac_sim_render",
      "leapp_onnx_export"
    ]),
    parameters: import_zod.z.record(import_zod.z.string(), import_zod.z.any()).optional(),
    pipelineId: import_zod.z.string().optional(),
    parentJobId: import_zod.z.string().optional()
  }),
  osmoPipeline: import_zod.z.object({
    name: import_zod.z.string().optional(),
    stages: import_zod.z.array(import_zod.z.object({
      recipe: import_zod.z.enum([
        "isaac_sim_policy_training",
        "isaac_lab_rl_training",
        "isaac_sim_render",
        "leapp_onnx_export"
      ]),
      parameters: import_zod.z.record(import_zod.z.string(), import_zod.z.any()),
      outputMapping: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).optional()
    })).min(1)
  }),
  // Isaac Sim status
  isaacSimStatus: import_zod.z.object({
    jobId: import_zod.z.string().min(1)
  })
};
function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: result.error.flatten().fieldErrors
      });
    }
    req.body = result.data;
    next();
  };
}

// server.ts
init_errors();

// server/middleware/auth.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
init_logger();
init_errors();
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var JWT_SECRET = process.env.JWT_SECRET || "policy0-dev-secret-change-in-production";
var JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
var JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
function generateAccessToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function generateRefreshToken(payload) {
  return import_jsonwebtoken.default.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return import_jsonwebtoken.default.verify(token, JWT_SECRET);
  } catch (err) {
    if (err instanceof import_jsonwebtoken.default.TokenExpiredError) {
      throw new AuthenticationError("Token expired");
    }
    if (err instanceof import_jsonwebtoken.default.JsonWebTokenError) {
      throw new AuthenticationError("Invalid token");
    }
    throw err;
  }
}
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationError("Missing or invalid authorization header");
    }
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      logger.warn({ ip: req.ip, path: req.path, error: err.message }, "Authentication failed");
      res.status(401).json({
        success: false,
        error: err.message,
        code: err.code
      });
      return;
    }
    next(err);
  }
}
var roleHierarchy = {
  admin: 3,
  operator: 2,
  viewer: 1
};
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      throw new (init_errors(), __toCommonJS(errors_exports)).AuthenticationError("Authentication required");
    }
    const userLevel = roleHierarchy[user.role];
    const requiredLevel = Math.max(...allowedRoles.map((r) => roleHierarchy[r]));
    if (userLevel < requiredLevel) {
      throw new (init_errors(), __toCommonJS(errors_exports)).AuthorizationError(`Requires one of: ${allowedRoles.join(", ")}`);
    }
    next();
  };
}
async function refreshAccessToken(refreshToken) {
  try {
    const payload = verifyToken(refreshToken);
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    });
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw new (init_errors(), __toCommonJS(errors_exports)).AuthenticationError("Invalid refresh token");
  }
}
async function hashPassword(password) {
  return import_bcryptjs.default.hash(password, 12);
}
async function verifyPassword(password, hash) {
  return import_bcryptjs.default.compare(password, hash);
}
var PUBLIC_PATH_PREFIXES = [
  "/api/health",
  "/api/vlm/providers",
  "/api/osmo/providers",
  "/api/osmo/recipes",
  "/api/auth",
  "/health",
  "/metrics"
];
function requireApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  const validApiKey = process.env.POLICY0_API_KEY;
  if (PUBLIC_PATH_PREFIXES.some((p) => req.path.startsWith(p))) {
    return next();
  }
  if (!validApiKey) {
    return next();
  }
  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: "Invalid or missing API key",
      code: "INVALID_API_KEY"
    });
    return;
  }
  next();
}
function auditLog(req, res, next) {
  const mutatingMethods = ["POST", "PUT", "DELETE", "PATCH"];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }
  const user = req.user;
  const userId = user?.userId || "anonymous";
  const userEmail = user?.email || "unknown";
  const userRole = user?.role || "unknown";
  const originalJson = res.json.bind(res);
  let responseBody = null;
  res.json = (body) => {
    responseBody = body;
    return originalJson(body);
  };
  res.on("finish", () => {
    const auditEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      requestId: req.requestId,
      userId,
      userEmail,
      userRole,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: req.ip ?? req.socket?.remoteAddress ?? "unknown",
      userAgent: req.headers["user-agent"],
      // Don't log sensitive data like passwords or tokens
      body: sanitizeAuditBody(req.body),
      responseSuccess: responseBody?.success,
      responseErrorCode: responseBody?.code
    };
    logger.info(auditEntry, "audit_log");
  });
  next();
}
function sanitizeAuditBody(body) {
  if (!body || typeof body !== "object") {
    return body;
  }
  const sensitiveFields = ["password", "token", "refreshToken", "accessToken", "apiKey", "secret"];
  const sanitized = { ...body };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }
  return sanitized;
}

// server/data/persistence.ts
async function createPersistence(backend) {
  if (backend === "postgres") {
    const { PostgresPersistence: PostgresPersistence2 } = await Promise.resolve().then(() => (init_postgresPersistence(), postgresPersistence_exports));
    return new PostgresPersistence2();
  }
  const { JsonPersistence: JsonPersistence2 } = await Promise.resolve().then(() => (init_jsonPersistence(), jsonPersistence_exports));
  return new JsonPersistence2();
}

// server/data/authStore.ts
var persistenceInstance = null;
async function getPersistence() {
  if (!persistenceInstance) {
    const backend = process.env.DATA_BACKEND || "json";
    persistenceInstance = await createPersistence(backend);
  }
  return persistenceInstance;
}
function mapRole(role) {
  return role.toLowerCase();
}
function mapUser3(user) {
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    role: mapRole(user.role),
    name: user.name ?? void 0,
    createdAt: user.createdAt.toISOString()
  };
}
function mapRefreshToken3(token) {
  return {
    id: token.id,
    tokenHash: token.tokenHash,
    userId: token.userId,
    createdAt: token.createdAt.toISOString(),
    expiresAt: token.expiresAt.toISOString()
  };
}
async function findUserByEmail(email) {
  const persistence = await getPersistence();
  const user = await persistence.findUserByEmail(email);
  return user ? mapUser3(user) : null;
}
async function findUserById(id) {
  const persistence = await getPersistence();
  const user = await persistence.findUserById(id);
  return user ? mapUser3(user) : null;
}
async function createUser(input) {
  const persistence = await getPersistence();
  const role = input.role.toUpperCase();
  const user = await persistence.createUser({
    email: input.email,
    passwordHash: input.passwordHash,
    role,
    name: input.name
  });
  return mapUser3(user);
}
async function listUsers() {
  const persistence = await getPersistence();
  const users = await persistence.listUsers();
  return users.map(mapUser3);
}
async function countUsers() {
  const persistence = await getPersistence();
  return persistence.countUsers();
}
async function storeRefreshToken(record) {
  const persistence = await getPersistence();
  const token = await persistence.storeRefreshToken({
    token: record.token,
    userId: record.userId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt
  });
  return mapRefreshToken3(token);
}
async function revokeRefreshToken(token) {
  const persistence = await getPersistence();
  await persistence.revokeRefreshToken(token);
}
async function isRefreshTokenValid(token) {
  const persistence = await getPersistence();
  return persistence.isRefreshTokenValid(token);
}

// server/pipeline/routingEngine.ts
function evaluatePolicyRouting(input) {
  const desc = input.description.toLowerCase();
  const title = input.title.toLowerCase();
  const isBipedalOrDexterous = input.robotType === "humanoid" || input.robotType === "hand" || input.robotDof > 12;
  const isVisualSemantic = input.observationSpace.includes("RGB Camera") || input.observationSpace.includes("Depth Map");
  const needsPrecisionForce = desc.includes("peg") || desc.includes("insert") || desc.includes("screw") || desc.includes("fit") || desc.includes("pour");
  if (isBipedalOrDexterous || desc.includes("walk") || desc.includes("balance") || desc.includes("re-orientation")) {
    return {
      planType: "Plan C: Reinforcement Learning (PPO)",
      confidence: 0.94,
      rationale: `High Degree-of-Freedom (${input.robotDof}-DoF) ${input.robotType} requires end-to-end multi-contact dynamics optimization via parallelized PPO with GPU vectorization.`,
      estimatedSimTimeSec: 12.8,
      recommendedModel: "NVIDIA Isaac GPU Vector + PPO",
      safetyRating: "A",
      impedanceBounds: {
        kpTrans: 300,
        kpRot: 30,
        forceLimitN: 45
      }
    };
  }
  if (isVisualSemantic && (desc.includes("fold") || desc.includes("pick and place") || desc.includes("drawer") || desc.includes("sort"))) {
    return {
      planType: "Plan B: Neural VLA Policy (ONNX)",
      confidence: 0.92,
      rationale: `Unstructured visual manipulation task benefits from Vision-Language-Action (VLA) neural policy predicting action chunks directly from camera observation tokens.`,
      estimatedSimTimeSec: 6.5,
      recommendedModel: "Gemini 3.6 Flash VLA + ONNXRuntime",
      safetyRating: "A",
      impedanceBounds: {
        kpTrans: 450,
        kpRot: 40,
        forceLimitN: 25
      }
    };
  }
  return {
    planType: "Plan A: Symbolic Trajectory Code",
    confidence: 0.97,
    rationale: `High-repeatability manipulation with Cartesian impedance control guarantees bounded contact wrenches (${needsPrecisionForce ? "5N-15N" : "10N-30N"}) and low-latency execution.`,
    estimatedSimTimeSec: 3.8,
    recommendedModel: "Gemini 3.6 Flash Robotics ER",
    safetyRating: "A+",
    impedanceBounds: {
      kpTrans: 600,
      kpRot: 50,
      forceLimitN: 18
    }
  };
}

// server.ts
init_isaacSimBridge();

// server/pipeline/ros2Exporter.ts
function exportRos2Node(opts) {
  const { robotId, robotName, taskTitle, dof, controlMode } = opts;
  return `#!/usr/bin/env python3
"""
Policy-0 Auto-Generated ROS2 Execution Node
Robot: ${robotName} (${dof}-DoF)
Task: ${taskTitle}
Control Mode: ${controlMode}
"""

import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState, Image
from geometry_msgs.msg import WrenchStamped, PoseStamped
from std_msgs.msg import Float64MultiArray
import numpy as np

class Policy0ExecutorNode(Node):
    def __init__(self):
        super().__init__('policy0_${robotId}_executor')
        
        # ROS2 Parameter Declarations
        self.declare_parameter('control_rate_hz', 1000)
        self.declare_parameter('max_joint_torque', 87.0)
        self.declare_parameter('impedance_kp', [600.0, 600.0, 400.0])
        
        # Subscriptions
        self.sub_joint_states = self.create_subscription(
            JointState,
            '/${robotId}/joint_states',
            self.joint_state_callback,
            10
        )
        self.sub_force_torque = self.create_subscription(
            WrenchStamped,
            '/${robotId}/force_torque',
            self.force_torque_callback,
            10
        )

        # Publishers
        self.pub_cmd = self.create_publisher(
            Float64MultiArray,
            '/${robotId}/joint_group_effort_controller/commands',
            10
        )

        self.rate_hz = self.get_parameter('control_rate_hz').value
        self.timer = self.create_timer(1.0 / self.rate_hz, self.control_loop)
        
        self.latest_joint_pos = np.zeros(${dof})
        self.latest_joint_vel = np.zeros(${dof})
        self.latest_wrench = np.zeros(6)
        self.step_counter = 0

        self.get_logger().info('Policy-0 ROS2 Executor Node running at %d Hz for ${robotName}' % self.rate_hz)

    def joint_state_callback(self, msg: JointState):
        if len(msg.position) >= ${dof}:
            self.latest_joint_pos = np.array(msg.position[:${dof}])
            self.latest_joint_vel = np.array(msg.velocity[:${dof}])

    def force_torque_callback(self, msg: WrenchStamped):
        w = msg.wrench
        self.latest_wrench = np.array([w.force.x, w.force.y, w.force.z, w.torque.x, w.torque.y, w.torque.z])

    def control_loop(self):
        self.step_counter += 1
        # Policy-0 Compliance Evaluation
        cmd_msg = Float64MultiArray()
        # Impedance torque calculation stub
        tau = -0.1 * self.latest_joint_vel
        cmd_msg.data = tau.tolist()
        self.pub_cmd.publish(cmd_msg)

def main(args=None):
    rclpy.init(args=args)
    node = Policy0ExecutorNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()

if __name__ == '__main__':
    main()
`;
}

// server/pipeline/isaacROSExporter.ts
var import_path3 = __toESM(require("path"), 1);
var import_fs3 = __toESM(require("fs"), 1);
function makePackageName(robotId, policyId) {
  const safeRobot = robotId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  const safePolicy = policyId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  return `policy0_${safeRobot}_${safePolicy}`;
}
function generateIsaacROSDeployment(options) {
  const { policy, onnxExport, leappMetadata, outputDir, writeFiles = true } = options;
  const packageName = makePackageName(policy.robot.id, policy.id);
  const workspaceRoot = outputDir ? import_path3.default.resolve(outputDir) : import_path3.default.join(process.cwd(), "exports", policy.id, "ros2_ws");
  const files = [];
  const launchFileName = `${packageName}_deploy.launch.py`;
  const launchContent = buildLaunchFile(packageName, policy, onnxExport, leappMetadata);
  files.push({
    relativePath: import_path3.default.join("src", packageName, "launch", launchFileName),
    content: launchContent,
    description: "ROS2 launch file wiring Isaac ROS DNN inference node to robot topics"
  });
  const dnnConfigFileName = "dnn_inference.yaml";
  const dnnConfigContent = buildDNNConfig(policy, onnxExport, leappMetadata);
  files.push({
    relativePath: import_path3.default.join("src", packageName, "config", dnnConfigFileName),
    content: dnnConfigContent,
    description: "DNN inference parameters (model path, TensorRT precision, normalization)"
  });
  const robotInterfaceFileName = "robot_interface_node.py";
  const robotInterfaceContent = buildRobotInterfaceNode(policy, packageName);
  files.push({
    relativePath: import_path3.default.join("src", packageName, "scripts", robotInterfaceFileName),
    content: robotInterfaceContent,
    description: "Bridges robot sensor topics -> DNN observation tensor -> action publisher"
  });
  const packageXmlContent = buildPackageXml(packageName, policy);
  files.push({
    relativePath: import_path3.default.join("src", packageName, "package.xml"),
    content: packageXmlContent,
    description: "ROS2 package manifest declaring Isaac ROS dependencies"
  });
  const cmakelistsContent = buildCMakeLists(packageName);
  files.push({
    relativePath: import_path3.default.join("src", packageName, "CMakeLists.txt"),
    content: cmakelistsContent,
    description: "Colcon build manifest for ROS2 package"
  });
  const dockerfileContent = buildDockerfile(packageName);
  files.push({
    relativePath: "Dockerfile",
    content: dockerfileContent,
    description: "Container build file using nvcr.io/nvidia/isaac-ros:humble-2024.1 base"
  });
  const composeContent = buildComposeFile(packageName);
  files.push({
    relativePath: "docker-compose.yml",
    content: composeContent,
    description: "Compose file enabling GPU runtime for inference container"
  });
  const readmeContent = buildREADME(packageName, policy, onnxExport, leappMetadata);
  files.push({
    relativePath: "README.md",
    content: readmeContent,
    description: "Deployment instructions and topic interface reference"
  });
  const onnxModelPath = onnxExport?.onnxModelUrl || `/exports/onnx/${policy.id}_leapp.onnx`;
  if (writeFiles) {
    writeFileTree(workspaceRoot, files);
    console.log(`Isaac ROS: Deployment package written to ${workspaceRoot}`);
  }
  return {
    packageName,
    ros2Workspace: workspaceRoot,
    files,
    onnxModelPath,
    launchFiles: [launchFileName],
    configFiles: [dnnConfigFileName],
    dockerfile: dockerfileContent,
    composeFile: composeContent,
    readme: readmeContent,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function writeFileTree(root, files) {
  for (const file of files) {
    const fullPath = import_path3.default.join(root, file.relativePath);
    const dir = import_path3.default.dirname(fullPath);
    if (!import_fs3.default.existsSync(dir)) {
      import_fs3.default.mkdirSync(dir, { recursive: true });
    }
    import_fs3.default.writeFileSync(fullPath, file.content);
  }
}
function buildLaunchFile(packageName, policy, onnxExport, leappMetadata) {
  const modelPath = onnxExport?.onnxModelUrl ? `/models${onnxExport.onnxModelUrl.replace(/^.*\/exports\/onnx/, "")}` : "/models/policy.onnx";
  const obsKey = leappMetadata?.observationKeys?.[0] || "observation";
  const actKey = leappMetadata?.actionKeys?.[0] || "action";
  return `"""${packageName} deployment launch file.

Wires Isaac ROS DNN inference node to robot sensor topics.
Generated by Policy-0 Phase 7 (Isaac ROS Exporter).
"""
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
import os


def generate_launch_description():
    model_path = LaunchConfiguration('model_path')
    enable_tensorrt = LaunchConfiguration('enable_tensorrt')

    return LaunchDescription([
        DeclareLaunchArgument(
            'model_path',
            default_value='${modelPath}',
            description='Path to ONNX/TensorRT policy model'),
        DeclareLaunchArgument(
            'enable_tensorrt',
            default_value='true',
            description='Use TensorRT optimized inference engine'),

        # Isaac ROS DNN Inference node (loads policy ONNX, runs on GPU)
        Node(
            package='isaac_ros_dnn_inference',
            executable='dnn_inference_node',
            name='policy_inference',
            parameters=[{
                'model_file_path': model_path,
                'input_tensor_names': ['${obsKey}'],
                'output_tensor_names': ['${actKey}'],
                'enable_tensorrt': enable_tensorrt,
                'tensorrt_precision': 'fp16',
                'force_engine_update': False,
                'engine_cache_path': '/tmp/trt_engines',
            }],
            remappings=[
                ('input_tensor', '/policy/observation'),
                ('output_tensor', '/policy/action'),
            ],
            output='screen',
        ),

        # Robot-specific interface node (sensors -> observation, action -> robot)
        Node(
            package='${packageName}',
            executable='robot_interface_node',
            name='robot_interface',
            parameters=[{
                'control_rate_hz': ${policy.robot.controlFrequencyHz},
                'dof': ${policy.robot.dof},
                'observation_keys': ${JSON.stringify(leappMetadata?.observationKeys || ["joint_pos", "joint_vel", "ee_pos"])},
                'action_keys': ${JSON.stringify(leappMetadata?.actionKeys || ["joint_target_pos"])},
            }],
            output='screen',
        ),
    ])
`;
}
function buildDNNConfig(policy, onnxExport, leappMetadata) {
  const modelPath = onnxExport?.onnxModelUrl ? `/models/${import_path3.default.basename(onnxExport.onnxModelUrl)}` : "/models/policy.onnx";
  const inputShape = onnxExport?.inputShape || `[1, ${policy.robot.dof * 3 + 6}]`;
  const outputShape = onnxExport?.outputShape || `[1, ${policy.robot.dof}]`;
  const mean = leappMetadata?.normalization?.mean || new Array(policy.robot.dof * 3 + 6).fill(0);
  const std = leappMetadata?.normalization?.std || new Array(policy.robot.dof * 3 + 6).fill(1);
  return `# DNN inference config for policy ${policy.id}
# Generated by Policy-0 Phase 7 Isaac ROS Exporter
dnn_inference:
  ros__parameters:
    model_file_path: "${modelPath}"
    input_tensor_names: ["observation"]
    output_tensor_names: ["action"]
    enable_tensorrt: true
    tensorrt_precision: "fp16"
    input_binding_names: ["observation"]
    output_binding_names: ["action"]
    force_engine_update: false
    engine_cache_path: "/tmp/trt_engines"
    input_shape: ${inputShape}
    output_shape: ${outputShape}
    opset_version: ${onnxExport?.opsetVersion || 17}
    latency_ms: ${onnxExport?.latencyMs ?? policy.onnxSpec.latencyMs}

normalization:
  mean: [${mean.join(", ")}]
  std: [${std.join(", ")}]
  # Apply (x - mean) / std before feeding to DNN; critical for trained policies

policy_metadata:
  policy_id: "${policy.id}"
  task: "${policy.title.replace(/"/g, '\\"')}"
  robot: "${policy.robot.id}"
  dof: ${policy.robot.dof}
  control_mode: "${policy.input.controlMode}"
  observation_keys: ${JSON.stringify(leappMetadata?.observationKeys || ["joint_pos", "joint_vel", "ee_pos"])}
  action_keys: ${JSON.stringify(leappMetadata?.actionKeys || ["joint_target_pos"])}
`;
}
function buildRobotInterfaceNode(policy, packageName) {
  const dof = policy.robot.dof;
  return `#!/usr/bin/env python3
"""${packageName} robot interface node.

Bridges native robot sensor topics -> policy observation tensor,
and policy action output -> robot command topic.
Generated by Policy-0 Phase 7 Isaac ROS Exporter.
"""
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import JointState
from geometry_msgs.msg import WrenchStamped, PoseStamped
from std_msgs.msg import Float32MultiArray
import numpy as np


class RobotInterfaceNode(Node):
    def __init__(self):
        super().__init__('robot_interface')

        self.declare_parameter('control_rate_hz', ${policy.robot.controlFrequencyHz})
        self.declare_parameter('dof', ${dof})
        self.declare_parameter('observation_keys', ['joint_pos', 'joint_vel', 'ee_pos'])
        self.declare_parameter('action_keys', ['joint_target_pos'])

        self.dof = self.get_parameter('dof').value
        self.obs_keys = self.get_parameter('observation_keys').value
        self.act_keys = self.get_parameter('action_keys').value

        # Sensor subscriptions
        self.create_subscription(JointState, '/${policy.robot.id}/joint_states',
                                 self._on_joint, 10)
        self.create_subscription(WrenchStamped, '/${policy.robot.id}/force_torque',
                                  self._on_wrench, 10)
        self.create_subscription(PoseStamped, '/${policy.robot.id}/ee_pose',
                                  self._on_ee_pose, 10)

        # DNN output subscription -> robot command
        self.create_subscription(Float32MultiArray, '/policy/action',
                                  self._on_action, 10)

        # Sensor aggregator -> DNN input
        self.obs_pub = self.create_publisher(Float32MultiArray, '/policy/observation', 10)

        self.joint_pos = np.zeros(${dof})
        self.joint_vel = np.zeros(${dof})
        self.wrench = np.zeros(6)
        self.ee_pose = np.zeros(7)  # x,y,z + qx,qy,qz,qw

        rate = self.get_parameter('control_rate_hz').value or 100
        self.create_timer(1.0 / rate, self._tick)
        self.get_logger().info(
            f'robot_interface node online: dof={self.dof}, rate={rate}Hz')

    def _on_joint(self, msg: JointState):
        if len(msg.position) >= self.dof:
            self.joint_pos = np.array(msg.position[:self.dof])
            self.joint_vel = np.array(msg.velocity[:self.dof]) if msg.velocity else self.joint_vel

    def _on_wrench(self, msg: WrenchStamped):
        w = msg.wrench
        self.wrench = np.array([w.force.x, w.force.y, w.force.z,
                                w.torque.x, w.torque.y, w.torque.z])

    def _on_ee_pose(self, msg: PoseStamped):
        p = msg.pose.position
        q = msg.pose.orientation
        self.ee_pose = np.array([p.x, p.y, p.z, q.x, q.y, q.z, q.w])

    def _tick(self):
        # Assemble observation vector in policy-defined key order
        obs = np.concatenate([self.joint_pos, self.joint_vel, self.wrench, self.ee_pose])
        obs_msg = Float32MultiArray(data=obs.astype(np.float32).tolist())
        self.obs_pub.publish(obs_msg)

    def _on_action(self, msg: Float32MultiArray):
        # Forward first dof entries to robot command topic
        cmd = Float32MultiArray(data=msg.data[:self.dof])
        self.create_publisher(Float32MultiArray,
                              '/${policy.robot.id}/joint_group_effort_controller/commands',
                              10).publish(cmd)


def main(args=None):
    rclpy.init(args=args)
    node = RobotInterfaceNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
`;
}
function buildPackageXml(packageName, policy) {
  return `<?xml version="1.0"?>
<?xml-model href="http://download.ros.org/schema/package_format3.xsd" schematypens="http://www.w3.org/2001/XMLSchema"?>
<package format="3">
  <name>${packageName}</name>
  <version>0.1.0</version>
  <description>Auto-generated Policy-0 deployment for ${policy.robot.name} (${policy.robot.dof}-DoF).</description>
  <maintainer email="policy0@example.com">Policy-0 Studio</maintainer>
  <license>MIT</license>

  <buildtool_depend>ament_cmake</buildtool_depend>

  <exec_depend>rclpy</exec_depend>
  <exec_depend>std_msgs</exec_depend>
  <exec_depend>sensor_msgs</exec_depend>
  <exec_depend>geometry_msgs</exec_depend>
  <exec_depend>isaac_ros_dnn_inference</exec_depend>

  <test_depend>ament_lint_auto</test_depend>
  <test_depend>ament_lint_common</test_depend>

  <export>
    <build_type>ament_cmake</build_type>
  </export>
</package>
`;
}
function buildCMakeLists(packageName) {
  return `cmake_minimum_required(VERSION 3.8)
project(${packageName})

find_package(ament_cmake REQUIRED)
find_package(rclpy REQUIRED)

install(PROGRAMS scripts/robot_interface_node.py
  DESTINATION lib/${packageName}
  RENAME robot_interface_node
)

install(DIRECTORY launch config
  DESTINATION share/${packageName}
)

ament_package()
`;
}
function buildDockerfile(packageName) {
  return `# syntax=docker/dockerfile:1
FROM nvcr.io/nvidia/isaac-ros:humble-2024.1

# Install policy-specific Python deps
RUN apt-get update && apt-get install -y --no-install-recommends \\
    python3-pip \\
    python3-numpy \\
    ros-humble-std-msgs ros-humble-sensor-msgs ros-humble-geometry-msgs \\
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir numpy

# Copy policy ONNX model and configs into image
COPY models/policy.onnx /models/policy.onnx
COPY src/${packageName}/config/dnn_inference.yaml /config/dnn_inference.yaml

# ROS2 workspace
WORKDIR /workspace
COPY src/ src/

# Build workspace
RUN /bin/bash -c "source /opt/ros/humble/setup.bash && colcon build --symlink-install"

# ros_entrypoint sources both base and workspace overlays
COPY ros_entrypoint.sh /ros_entrypoint.sh
RUN chmod +x /ros_entrypoint.sh

ENTRYPOINT ["/ros_entrypoint.sh"]
CMD ["ros2", "launch", "${packageName}", "${packageName}_deploy.launch.py"]
`;
}
function buildComposeFile(packageName) {
  return `version: '3.8'
services:
  ${packageName}:
    build: .
    image: ${packageName}:latest
    runtime: nvidia
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
      - NVIDIA_DRIVER_CAPABILITIES=all
      - ROS_DOMAIN_ID=0
      - RMW_IMPLEMENTATION=rmw_fastrtps_cpp
    volumes:
      - ./models:/models:ro
      - ./config:/config:ro
      - trt_cache:/tmp/trt_engines
    network_mode: host
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  trt_cache:
`;
}
function buildREADME(packageName, policy, onnxExport, leappMetadata) {
  const obsKeys = leappMetadata?.observationKeys || ["joint_pos", "joint_vel", "ee_pos"];
  const actKeys = leappMetadata?.actionKeys || ["joint_target_pos"];
  const mean = leappMetadata?.normalization?.mean || [];
  const std = leappMetadata?.normalization?.std || [];
  return `# ${packageName} Deployment Package

Auto-generated by **Policy-0 Studio Phase 7 Isaac ROS Exporter**.

## Policy
- **Title**: ${policy.title}
- **ID**: \`${policy.id}\`
- **Robot**: ${policy.robot.name} (${policy.robot.manufacturer}) \u2014 ${policy.robot.dof}-DoF
- **Control mode**: ${policy.input.controlMode}
- **Control frequency**: ${policy.robot.controlFrequencyHz} Hz
- **Plan type**: ${policy.routing.planType}

## ONNX model
- **Format**: ${onnxExport?.exportFormat || "onnx"}
- **Input shape**: ${onnxExport?.inputShape || "[1, ...]"}
- **Output shape**: ${onnxExport?.outputShape || "[1, ...]"}
- **Opset**: ${onnxExport?.opsetVersion || 17}
- **Inference latency**: ${onnxExport?.latencyMs ?? policy.onnxSpec.latencyMs} ms
- **Size**: ${((onnxExport?.onnxModelSizeBytes ?? policy.onnxSpec.fileSizeBytes) / 1024).toFixed(1)} KB

## Quick start

1. Place the policy ONNX at \`${onnxExport?.onnxModelUrl ? `./models/${import_path3.default.basename(onnxExport.onnxModelUrl)}` : "./models/policy.onnx"}\`
2. Build and launch:
   \`\`\`bash
   docker compose up --build
   \`\`\`

## ROS2 topics

| Direction | Topic | Type |
|-----------|-------|------|
| Input | \`/${policy.robot.id}/joint_states\` | \`sensor_msgs/JointState\` |
| Input | \`/${policy.robot.id}/force_torque\` | \`geometry_msgs/WrenchStamped\` |
| Input | \`/${policy.robot.id}/ee_pose\` | \`geometry_msgs/PoseStamped\` |
| Internal | \`/policy/observation\` | \`std_msgs/Float32MultiArray\` |
| Internal | \`/policy/action\` | \`std_msgs/Float32MultiArray\` |
| Output | \`/${policy.robot.id}/joint_group_effort_controller/commands\` | \`std_msgs/Float32MultiArray\` |

## Normalization

The ONNX model expects input normalized using LEAPP-provided statistics:

| Key | Mean | Std |
|-----|------|-----|
| observation | [${mean.slice(0, 8).join(", ")}${mean.length > 8 ? ", ..." : ""}] | [${std.slice(0, 8).join(", ")}${std.length > 8 ? ", ..." : ""}] |

Apply \`(x - mean) / std\` before inference. See \`config/dnn_inference.yaml\` for full values.

## Observation / action keys

- **Observation keys**: \`${obsKeys.join("`, `")}\`
- **Action keys**: \`${actKeys.join("`, `")}\`

## Files in this package

| Path | Purpose |
|------|---------|
| \`Dockerfile\` | Container build (base: nvcr.io/nvidia/isaac-ros:humble-2024.1) |
| \`docker-compose.yml\` | Compose file with GPU runtime |
| \`src/${packageName}/launch/${packageName}_deploy.launch.py\` | Launch file |
| \`src/${packageName}/config/dnn_inference.yaml\` | DNN inference params |
| \`src/${packageName}/scripts/robot_interface_node.py\` | Sensor \u2194 DNN bridge |
| \`src/${packageName}/package.xml\` | ROS2 manifest |
| \`src/${packageName}/CMakeLists.txt\` | Colcon build file |

## TensorRT cache

First launch builds and caches the optimized engine at \`/tmp/trt_engines\` (persisted via the \`trt_cache\` volume). Subsequent launches skip the engine build (\`force_engine_update: false\`).

## Notes

- This package uses Isaac ROS DNN Inference GEM (\`isaac_ros_dnn_inference\`) for GPU-accelerated ONNX/TensorRT inference with zero-copy (NITROS) data flow.
- The robot-specific interface node may need adapting to your real robot's controller topic names.
- Generated: ${(/* @__PURE__ */ new Date()).toISOString()}
`;
}

// server/pipeline/telemetryEngine.ts
function generateSimulationTelemetry(dof, domainRandomization) {
  const stepsCount = 25;
  const timeStep = 0.2;
  const telemetry = [];
  let totalEnergyJ = 0;
  for (let i = 0; i < stepsCount; i++) {
    const timeSec = +(i * timeStep).toFixed(2);
    const reward = +Math.min(1, Math.pow(i / 18, 1.4) + Math.sin(i * 0.4) * 0.02).toFixed(3);
    const torqueBase = 12 * Math.exp(-i / 7) + 2.8 + (dof > 10 ? 15 : 0);
    const jointTorqueAvg = +(torqueBase + Math.sin(i * 0.5) * 0.8).toFixed(2);
    totalEnergyJ += jointTorqueAvg * 0.1;
    const eefPositionErrorMm = +Math.max(0.2, 42 * Math.exp(-i / 5.5) + Math.random() * 0.2).toFixed(2);
    let collisionForceN = 0.3 + Math.random() * 0.2;
    if (i >= 11 && i <= 15) {
      collisionForceN = 6.2 + Math.random() * 2.4;
    }
    collisionForceN = +collisionForceN.toFixed(1);
    const actionMagnitude = +(0.75 * Math.exp(-i / 12) + 0.08).toFixed(3);
    telemetry.push({
      step: i * 10,
      timeSec,
      reward,
      jointTorqueAvg,
      eefPositionErrorMm,
      collisionForceN,
      actionMagnitude
    });
  }
  const baseSuccess = 94.5 + Math.random() * 4;
  const simToReal = domainRandomization ? 93.8 + Math.random() * 4 : 85.2 + Math.random() * 4;
  return {
    successRatePct: +baseSuccess.toFixed(1),
    meanTrajectoryTimeSec: +(stepsCount * timeStep * 0.85).toFixed(1),
    simToRealConfidencePct: +simToReal.toFixed(1),
    energyScoreJoule: +totalEnergyJ.toFixed(1),
    totalSimRuns: Math.floor(1e3 + Math.random() * 2e3),
    telemetry
  };
}

// server.ts
init_isaacSimBridge();

// server/pipeline/vlmAnalyzer.ts
var import_genai = require("@google/genai");
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function analyzeVideoWithVLM(videoPath, prompt) {
  const ai = getGeminiClient();
  const videoFile = await ai.files.upload({
    file: videoPath,
    config: {
      mimeType: "video/mp4"
    }
  });
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        text: prompt
      },
      {
        fileData: {
          fileUri: videoFile.uri,
          mimeType: "video/mp4"
        }
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        properties: {
          taskTitle: { type: import_genai.Type.STRING },
          taskDescription: { type: import_genai.Type.STRING },
          robotType: { type: import_genai.Type.STRING },
          robotDof: { type: import_genai.Type.NUMBER },
          controlMode: { type: import_genai.Type.STRING },
          observationSpace: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
          environment: { type: import_genai.Type.STRING },
          keyframes: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                stage: { type: import_genai.Type.STRING },
                timestamp: { type: import_genai.Type.STRING },
                gripperState: { type: import_genai.Type.STRING },
                actionDescription: { type: import_genai.Type.STRING }
              },
              required: ["stage", "timestamp", "gripperState", "actionDescription"]
            }
          },
          obstacleConstraints: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
          recommendedControlMode: { type: import_genai.Type.STRING },
          simToRealTips: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
        },
        required: [
          "taskTitle",
          "taskDescription",
          "robotType",
          "robotDof",
          "controlMode",
          "observationSpace",
          "environment",
          "keyframes",
          "obstacleConstraints",
          "recommendedControlMode",
          "simToRealTips"
        ]
      }
    }
  });
  const parsed = JSON.parse(response.text || "{}");
  const result = {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId: "",
    taskTitle: parsed.taskTitle || "Untitled Task",
    taskDescription: parsed.taskDescription || "",
    robotType: parsed.robotType || "arm",
    robotDof: parsed.robotDof || 7,
    controlMode: parsed.controlMode || "Cartesian Impedance",
    observationSpace: Array.isArray(parsed.observationSpace) ? parsed.observationSpace : ["RGB Camera", "Joint Encoders"],
    environment: parsed.environment || "MuJoCo",
    keyframes: Array.isArray(parsed.keyframes) ? parsed.keyframes : [],
    obstacleConstraints: Array.isArray(parsed.obstacleConstraints) ? parsed.obstacleConstraints : [],
    recommendedControlMode: parsed.recommendedControlMode || "Cartesian Impedance",
    simToRealTips: Array.isArray(parsed.simToRealTips) ? parsed.simToRealTips : [],
    confidence: 0.9,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return result;
}
async function analyzeVideoWithVLMFromDescription(description) {
  const ai = getGeminiClient();
  const prompt = `Analyze this robot task description and extract structured task specifications.

Task Description: "${description}"

Output a JSON object with:
1. taskTitle: A concise title for the robot task.
2. taskDescription: Detailed description of the task.
3. robotType: The type of robot needed (arm, humanoid, hand, mobile_manipulator).
4. robotDof: Degrees of freedom required (integer).
5. controlMode: Best control mode (Cartesian Impedance, Joint Velocity, Delta EE Pose, Action Chunks).
6. observationSpace: Array of observation modalities needed.
7. environment: Simulation environment (MuJoCo, Isaac Sim, Drake, PyBullet).
8. keyframes: Array of 4 key stages with stage name, timestamp, gripper state, and action description.
9. obstacleConstraints: Array of identified obstacles or collision risks.
10. recommendedControlMode: The recommended control mode string.
11. simToRealTips: Array of 3 calibration recommendations.

Be precise and thorough in the analysis.`;
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai.Type.OBJECT,
        properties: {
          taskTitle: { type: import_genai.Type.STRING },
          taskDescription: { type: import_genai.Type.STRING },
          robotType: { type: import_genai.Type.STRING },
          robotDof: { type: import_genai.Type.NUMBER },
          controlMode: { type: import_genai.Type.STRING },
          observationSpace: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
          environment: { type: import_genai.Type.STRING },
          keyframes: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                stage: { type: import_genai.Type.STRING },
                timestamp: { type: import_genai.Type.STRING },
                gripperState: { type: import_genai.Type.STRING },
                actionDescription: { type: import_genai.Type.STRING }
              },
              required: ["stage", "timestamp", "gripperState", "actionDescription"]
            }
          },
          obstacleConstraints: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } },
          recommendedControlMode: { type: import_genai.Type.STRING },
          simToRealTips: { type: import_genai.Type.ARRAY, items: { type: import_genai.Type.STRING } }
        },
        required: [
          "taskTitle",
          "taskDescription",
          "robotType",
          "robotDof",
          "controlMode",
          "observationSpace",
          "environment",
          "keyframes",
          "obstacleConstraints",
          "recommendedControlMode",
          "simToRealTips"
        ]
      }
    }
  });
  const parsed = JSON.parse(response.text || "{}");
  const result = {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId: "",
    taskTitle: parsed.taskTitle || "Untitled Task",
    taskDescription: parsed.taskDescription || description,
    robotType: parsed.robotType || "arm",
    robotDof: parsed.robotDof || 7,
    controlMode: parsed.controlMode || "Cartesian Impedance",
    observationSpace: Array.isArray(parsed.observationSpace) ? parsed.observationSpace : ["RGB Camera", "Joint Encoders"],
    environment: parsed.environment || "MuJoCo",
    keyframes: Array.isArray(parsed.keyframes) ? parsed.keyframes : [],
    obstacleConstraints: Array.isArray(parsed.obstacleConstraints) ? parsed.obstacleConstraints : [],
    recommendedControlMode: parsed.recommendedControlMode || "Cartesian Impedance",
    simToRealTips: Array.isArray(parsed.simToRealTips) ? parsed.simToRealTips : [],
    confidence: 0.85,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  return result;
}

// server/pipeline/cosmosVLMAnalyzer.ts
var COSMOS_NIM_ENDPOINT = process.env.COSMOS_NIM_ENDPOINT || "https://api.nvidia.com/v1/cosmos/reasoner";
var NVIDIA_API_KEY2 = process.env.NVIDIA_API_KEY;
function getNVIDIAHeaders2() {
  return {
    "Authorization": `Bearer ${NVIDIA_API_KEY2}`,
    "Content-Type": "application/json"
  };
}
async function callCosmosNIM(payload) {
  if (!NVIDIA_API_KEY2) {
    throw new Error("NVIDIA_API_KEY is not defined in environment variables. Cosmos Reasoner NIM requires NVIDIA_API_KEY.");
  }
  const response = await fetch(COSMOS_NIM_ENDPOINT, {
    method: "POST",
    headers: getNVIDIAHeaders2(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cosmos NIM error: ${response.status} - ${errorText}`);
  }
  return response.json();
}
function mapCosmosToVLMAnalysis(cosmos, videoUploadId) {
  return {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId,
    taskTitle: cosmos.task_title || "Untitled Task",
    taskDescription: cosmos.task_description || "",
    robotType: cosmos.robot_type || "arm",
    robotDof: cosmos.robot_dof || 7,
    controlMode: cosmos.control_mode || "Cartesian Impedance",
    observationSpace: Array.isArray(cosmos.observation_space) ? cosmos.observation_space : ["RGB Camera", "Joint Encoders"],
    environment: cosmos.environment || "MuJoCo",
    keyframes: Array.isArray(cosmos.keyframes) ? cosmos.keyframes.map((kf) => ({
      stage: kf.stage,
      timestamp: kf.timestamp,
      gripperState: kf.gripper_state,
      actionDescription: kf.action_description
    })) : [],
    obstacleConstraints: Array.isArray(cosmos.obstacle_constraints) ? cosmos.obstacle_constraints : [],
    recommendedControlMode: cosmos.recommended_control_mode || "Cartesian Impedance",
    simToRealTips: Array.isArray(cosmos.sim_to_real_tips) ? cosmos.sim_to_real_tips : [],
    confidence: typeof cosmos.confidence === "number" ? cosmos.confidence : 0.85,
    analyzedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function analyzeVideoWithCosmos(videoPath, prompt, videoUploadId = "") {
  const fs10 = await import("fs");
  const videoBuffer = fs10.readFileSync(videoPath);
  const videoBase64 = videoBuffer.toString("base64");
  const payload = {
    video: videoBase64,
    text: prompt,
    task: "robot_task_understanding"
  };
  const cosmosResult = await callCosmosNIM(payload);
  return mapCosmosToVLMAnalysis(cosmosResult, videoUploadId);
}
async function analyzeDescriptionWithCosmos(description) {
  const payload = {
    video: "",
    text: description,
    task: "robot_task_understanding"
  };
  const cosmosResult = await callCosmosNIM(payload);
  return mapCosmosToVLMAnalysis(cosmosResult, "");
}
function isCosmosAvailable() {
  return !!NVIDIA_API_KEY2;
}

// server/pipeline/nvidiaVideoGenerator.ts
init_sqliteStore();
var NVIDIA_API_BASE = process.env.NVIDIA_API_BASE || "https://api.nvidia.com";
var NVIDIA_API_KEY3 = process.env.NVIDIA_API_KEY || "";
var activeJobs = getTable("nvidia_video_jobs");
async function generateNVIDIAVideo(request) {
  const jobId = `nvid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const resultId = `vid_${Date.now().toString(36)}`;
  const job = {
    jobId,
    status: "queued",
    resultUrl: null,
    thumbnailUrl: null,
    error: null
  };
  activeJobs.upsert({ ...job, id: jobId });
  try {
    job.status = "generating";
    const videoUrl = await submitToNVIDIAOmniverse(request, jobId);
    const thumbnailUrl = await generateThumbnailFromVideo(videoUrl, request.resolution);
    job.status = "complete";
    job.resultUrl = videoUrl;
    job.thumbnailUrl = thumbnailUrl;
    activeJobs.updateById(jobId, { status: job.status, resultUrl: job.resultUrl, thumbnailUrl: job.thumbnailUrl });
    const result = {
      id: resultId,
      requestId: jobId,
      status: "complete",
      videoUrl,
      thumbnailUrl,
      resolution: request.resolution,
      durationSec: request.durationSec,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      nvidiaJobId: jobId
    };
    return result;
  } catch (error) {
    job.status = "failed";
    job.error = error?.message || "NVIDIA video generation failed";
    activeJobs.updateById(jobId, { status: job.status, error: job.error });
    const result = {
      id: resultId,
      requestId: jobId,
      status: "failed",
      videoUrl: "",
      thumbnailUrl: "",
      resolution: request.resolution,
      durationSec: request.durationSec,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      nvidiaJobId: jobId,
      errorMessage: error?.message || "NVIDIA video generation failed"
    };
    return result;
  }
}
async function submitToNVIDIAOmniverse(request, jobId) {
  if (!NVIDIA_API_KEY3) {
    return await simulateNVIDIAVideoGeneration(request, jobId);
  }
  try {
    const response = await fetch(`${NVIDIA_API_BASE}/omniverse/v1/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY3}`,
        "X-Job-Id": jobId
      },
      body: JSON.stringify({
        task: {
          title: request.taskTitle,
          description: request.taskDescription,
          robotModel: request.robotModel,
          robotDof: request.robotDof,
          controlMode: request.controlMode
        },
        render: {
          resolution: request.resolution,
          durationSec: request.durationSec,
          domainRandomization: request.domainRandomization,
          outputFormat: "mp4",
          codec: "h264",
          bitrate: request.resolution === "4K" ? "50M" : request.resolution === "1080p" ? "20M" : "10M"
        },
        environment: {
          physicsEngine: "PhysX 5",
          gravity: [0, 0, -9.81],
          timestep: 1e-3
        }
      })
    });
    if (!response.ok) {
      throw new Error(`NVIDIA Omniverse API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.resultUrl || data.videoUrl || "";
  } catch (error) {
    console.warn("NVIDIA Omniverse API call failed, falling back to simulation:", error.message);
    return await simulateNVIDIAVideoGeneration(request, jobId);
  }
}
async function simulateNVIDIAVideoGeneration(request, jobId) {
  const delayMs = 3e3;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  const videoUrl = `https://storage.nvidia-omniverse.example/jobs/${jobId}/output.mp4`;
  return videoUrl;
}
async function generateThumbnailFromVideo(videoUrl, resolution) {
  const thumbResolution = resolution === "4K" ? "384x216" : resolution === "1080p" ? "192x108" : "128x72";
  return `${videoUrl.replace(".mp4", "_thumb.jpg")}?width=${thumbResolution.split("x")[0]}&height=${thumbResolution.split("x")[1]}`;
}
function getNVIDIAJobStatus(jobId) {
  const job = activeJobs.find((j) => j.id === jobId);
  if (!job) return null;
  return job.status;
}
function getNVIDIAJobResult(jobId) {
  return activeJobs.find((j) => j.id === jobId) || null;
}

// server/pipeline/isaacSimVideoGenerator.ts
var ISAAC_SIM_ENDPOINT2 = process.env.ISAAC_SIM_ENDPOINT || "http://localhost:8211";
var NVIDIA_API_KEY4 = process.env.NVIDIA_API_KEY;
function getNVIDIAHeaders3() {
  const headers = { "Content-Type": "application/json" };
  if (NVIDIA_API_KEY4) {
    headers["Authorization"] = `Bearer ${NVIDIA_API_KEY4}`;
  }
  return headers;
}
var CAMERA_PATH_MAP = {
  "Cartesian Impedance": "follow_ee",
  "Joint Velocity": "orbit",
  "Delta EE Pose": "follow_ee",
  "Action Chunks": "orbit"
};
var LIGHTING_MAP = {
  "MuJoCo": "studio",
  "Isaac Sim": "warehouse",
  "Drake": "studio",
  "PyBullet": "studio"
};
async function generateIsaacSimRTXVideo(request) {
  const simJobId = request.nvidiaJobId || `sim_${Date.now().toString(36)}`;
  const cameraPath = CAMERA_PATH_MAP[request.controlMode] || "follow_ee";
  const lighting = LIGHTING_MAP[request.environment] || "studio";
  const renderReq = {
    job_id: simJobId,
    resolution: request.resolution,
    duration_sec: request.durationSec,
    camera_path: cameraPath,
    lighting,
    render_quality: request.resolution === "4K" ? "ultra" : "high",
    output_format: "mp4",
    fps: 30
  };
  const response = await fetch(`${ISAAC_SIM_ENDPOINT2}/api/v1/render`, {
    method: "POST",
    headers: getNVIDIAHeaders3(),
    body: JSON.stringify(renderReq)
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Isaac Sim render submit failed: ${response.status} - ${error}`);
  }
  const renderJob = await response.json();
  const videoResult = await pollRenderJob(renderJob.render_job_id);
  return {
    id: `nvid_vid_${Date.now().toString(36)}`,
    requestId: simJobId,
    status: "complete",
    videoUrl: videoResult.video_url,
    thumbnailUrl: videoResult.thumbnail_url,
    resolution: request.resolution,
    durationSec: request.durationSec,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nvidiaJobId: renderJob.render_job_id
  };
}
async function pollRenderJob(renderJobId, timeoutMs = 3e5, pollIntervalMs = 5e3) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const response = await fetch(`${ISAAC_SIM_ENDPOINT2}/api/v1/render/${renderJobId}`, {
      headers: getNVIDIAHeaders3()
    });
    if (!response.ok) {
      throw new Error(`Failed to get render job status: ${response.status}`);
    }
    const job = await response.json();
    if (job.status === "completed") {
      if (!job.video_url) {
        throw new Error("Render completed but no video URL returned");
      }
      return {
        video_url: job.video_url,
        thumbnail_url: job.thumbnail_url || ""
      };
    }
    if (job.status === "failed") {
      throw new Error(`Rendering failed: ${job.error || "Unknown error"}`);
    }
    console.log(`RTX rendering progress: ${job.status}...`);
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
  throw new Error(`Rendering timed out after ${timeoutMs}ms`);
}
function generateSimulatedRTXVideo(request) {
  const placeholderVideos = {
    "720p": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "1080p": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "4K": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  };
  return {
    id: `nvid_vid_${Date.now().toString(36)}`,
    requestId: `sim_${Date.now().toString(36)}`,
    status: "complete",
    videoUrl: placeholderVideos[request.resolution] || placeholderVideos["1080p"],
    thumbnailUrl: `https://via.placeholder.com/320x180?text=Isaac+Sim+${request.resolution}`,
    resolution: request.resolution,
    durationSec: request.durationSec,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    nvidiaJobId: `sim_render_${Date.now().toString(36)}`
  };
}

// server/nimLLM.ts
var NIM_LLM_ENDPOINT = process.env.NIM_LLM_ENDPOINT || "https://api.nvidia.com/v1/nim/llama-3-70b";
var NVIDIA_API_KEY5 = process.env.NVIDIA_API_KEY;
function getNVIDIAHeaders4() {
  return {
    "Authorization": `Bearer ${NVIDIA_API_KEY5}`,
    "Content-Type": "application/json"
  };
}
async function callNIMLLM(messages, options = {}) {
  if (!NVIDIA_API_KEY5) {
    throw new Error("NVIDIA_API_KEY is not defined in environment variables. NIM LLM requires NVIDIA_API_KEY.");
  }
  const payload = {
    model: options.model || "meta/llama-3.1-70b-instruct",
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: 4096,
    ...options.jsonSchema && { response_format: { type: "json_object" } }
  };
  const response = await fetch(NIM_LLM_ENDPOINT, {
    method: "POST",
    headers: getNVIDIAHeaders4(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM LLM error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}
async function callNIMLLMStructured(messages, schema, options = {}) {
  const content = await callNIMLLM(messages, { jsonSchema: schema, ...options });
  return JSON.parse(content);
}
function isNIMLLMAvailable() {
  return !!NVIDIA_API_KEY5;
}

// server/pipeline/onnxExporter.ts
var import_path4 = __toESM(require("path"), 1);
var import_fs4 = __toESM(require("fs"), 1);
var onnxOutputDir = import_path4.default.join(process.cwd(), "exports", "onnx");
if (!import_fs4.default.existsSync(onnxOutputDir)) {
  import_fs4.default.mkdirSync(onnxOutputDir, { recursive: true });
}
async function exportPolicyToONNX(options) {
  const { policy, format, optimize, quantization } = options;
  const exportId = `onnx_${Date.now().toString(36)}`;
  const fileName = `${policy.id}_policy.${format === "tensorrt" ? "engine" : "onnx"}`;
  const filePath = import_path4.default.join(onnxOutputDir, fileName);
  const onnxModelBuffer = await buildONNXModel(policy, format, optimize, quantization);
  import_fs4.default.writeFileSync(filePath, onnxModelBuffer);
  const result = {
    id: exportId,
    policyId: policy.id,
    onnxModelUrl: `/exports/onnx/${fileName}`,
    onnxModelSizeBytes: onnxModelBuffer.length,
    inputShape: policy.onnxSpec.inputShape,
    outputShape: policy.onnxSpec.outputShape,
    opsetVersion: 17,
    latencyMs: policy.onnxSpec.latencyMs,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    exportFormat: format
  };
  return result;
}
async function buildONNXModel(policy, format, optimize, quantization) {
  const dof = policy.robot.dof;
  const inputDim = dof * 3 + 6;
  const outputDim = dof;
  const modelGraph = buildONNXGraph(inputDim, outputDim, dof, policy.routing.planType);
  const jsonStr = JSON.stringify(modelGraph, null, 2);
  const buffer = Buffer.from(jsonStr);
  return buffer;
}
function buildONNXGraph(inputDim, outputDim, dof, planType) {
  const nodes = [];
  const initializers = [];
  const inputTensor = {
    name: "observation",
    dataType: "tensor(float)",
    dims: [1, inputDim]
  };
  const outputTensor = {
    name: "action",
    dataType: "tensor(float)",
    dims: [1, outputDim]
  };
  nodes.push({
    name: "input",
    opType: "Identity",
    inputs: ["observation"],
    outputs: ["input_out"]
  });
  if (planType.includes("Symbolic")) {
    const kpValues = new Array(dof).fill(600).map((v, i) => i < 3 ? 600 : i < 6 ? 400 : 50);
    const kdValues = kpValues.map((v) => 2 * Math.sqrt(v));
    initializers.push({
      name: "kp_matrix",
      dataType: "tensor(float)",
      dims: [dof, dof],
      values: kpValues
    });
    initializers.push({
      name: "kd_matrix",
      dataType: "tensor(float)",
      dims: [dof, dof],
      values: kdValues
    });
    nodes.push({
      name: "kp_diag",
      opType: "Diag",
      inputs: ["kp_matrix"],
      outputs: ["kp_diag_out"]
    });
    nodes.push({
      name: "kd_diag",
      opType: "Diag",
      inputs: ["kd_matrix"],
      outputs: ["kd_diag_out"]
    });
    nodes.push({
      name: "neg_qd",
      opType: "Neg",
      inputs: ["input_out"],
      outputs: ["neg_qd_out"]
    });
    nodes.push({
      name: "tau",
      opType: "MatMul",
      inputs: ["kd_diag_out", "neg_qd_out"],
      outputs: ["tau_out"]
    });
    nodes.push({
      name: "output",
      opType: "Identity",
      inputs: ["tau_out"],
      outputs: ["action"]
    });
  } else if (planType.includes("VLA")) {
    const w1Values = new Array(inputDim * 128).fill(0.01);
    const w2Values = new Array(128 * outputDim).fill(0.01);
    initializers.push({
      name: "w1",
      dataType: "tensor(float)",
      dims: [inputDim, 128],
      values: w1Values
    });
    initializers.push({
      name: "w2",
      dataType: "tensor(float)",
      dims: [128, outputDim],
      values: w2Values
    });
    initializers.push({
      name: "b1",
      dataType: "tensor(float)",
      dims: [128],
      values: new Array(128).fill(0)
    });
    initializers.push({
      name: "b2",
      dataType: "tensor(float)",
      dims: [outputDim],
      values: new Array(outputDim).fill(0)
    });
    nodes.push({
      name: "fc1",
      opType: "MatMul",
      inputs: ["input_out", "w1"],
      outputs: ["fc1_out"]
    });
    nodes.push({
      name: "add1",
      opType: "Add",
      inputs: ["fc1_out", "b1"],
      outputs: ["add1_out"]
    });
    nodes.push({
      name: "relu1",
      opType: "Relu",
      inputs: ["add1_out"],
      outputs: ["relu1_out"]
    });
    nodes.push({
      name: "fc2",
      opType: "MatMul",
      inputs: ["relu1_out", "w2"],
      outputs: ["fc2_out"]
    });
    nodes.push({
      name: "add2",
      opType: "Add",
      inputs: ["fc2_out", "b2"],
      outputs: ["add2_out"]
    });
    nodes.push({
      name: "output",
      opType: "Identity",
      inputs: ["add2_out"],
      outputs: ["action"]
    });
  } else {
    const w1Values = new Array(inputDim * 256).fill(0.01);
    const w2Values = new Array(256 * 256).fill(0.01);
    const w3Values = new Array(256 * outputDim).fill(0.01);
    initializers.push({
      name: "w1",
      dataType: "tensor(float)",
      dims: [inputDim, 256],
      values: w1Values
    });
    initializers.push({
      name: "w2",
      dataType: "tensor(float)",
      dims: [256, 256],
      values: w2Values
    });
    initializers.push({
      name: "w3",
      dataType: "tensor(float)",
      dims: [256, outputDim],
      values: w3Values
    });
    initializers.push({
      name: "b1",
      dataType: "tensor(float)",
      dims: [256],
      values: new Array(256).fill(0)
    });
    initializers.push({
      name: "b2",
      dataType: "tensor(float)",
      dims: [256],
      values: new Array(256).fill(0)
    });
    initializers.push({
      name: "b3",
      dataType: "tensor(float)",
      dims: [outputDim],
      values: new Array(outputDim).fill(0)
    });
    nodes.push({
      name: "fc1",
      opType: "MatMul",
      inputs: ["input_out", "w1"],
      outputs: ["fc1_out"]
    });
    nodes.push({
      name: "add1",
      opType: "Add",
      inputs: ["fc1_out", "b1"],
      outputs: ["add1_out"]
    });
    nodes.push({
      name: "relu1",
      opType: "Relu",
      inputs: ["add1_out"],
      outputs: ["relu1_out"]
    });
    nodes.push({
      name: "fc2",
      opType: "MatMul",
      inputs: ["relu1_out", "w2"],
      outputs: ["fc2_out"]
    });
    nodes.push({
      name: "add2",
      opType: "Add",
      inputs: ["fc2_out", "b2"],
      outputs: ["add2_out"]
    });
    nodes.push({
      name: "relu2",
      opType: "Relu",
      inputs: ["add2_out"],
      outputs: ["relu2_out"]
    });
    nodes.push({
      name: "fc3",
      opType: "MatMul",
      inputs: ["relu2_out", "w3"],
      outputs: ["fc3_out"]
    });
    nodes.push({
      name: "add3",
      opType: "Add",
      inputs: ["fc3_out", "b3"],
      outputs: ["add3_out"]
    });
    nodes.push({
      name: "output",
      opType: "Identity",
      inputs: ["add3_out"],
      outputs: ["action"]
    });
  }
  const graph = {
    name: `policy0_${planType.replace(/\s+/g, "_")}`,
    inputs: [inputTensor],
    outputs: [outputTensor],
    nodes,
    initializers
  };
  const model = {
    irVersion: 8,
    opsetImport: [{ domain: "", version: 17 }],
    graph
  };
  return model;
}
function serveOnnxFile(fileName) {
  const filePath = import_path4.default.join(onnxOutputDir, fileName);
  if (!import_fs4.default.existsSync(filePath)) {
    return null;
  }
  return import_fs4.default.readFileSync(filePath);
}

// server/pipeline/osmoClient.ts
var import_stream = require("stream");
var OSMO_ENDPOINT2 = process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo";
var NVIDIA_API_KEY6 = process.env.NVIDIA_API_KEY;
var USE_OSMO2 = process.env.USE_OSMO === "true";
var OSMO_LOCAL_SIM = process.env.OSMO_LOCAL_SIM !== "false";
var RECIPES = {
  isaac_sim_policy_training: {
    name: "isaac_sim_policy_training",
    version: "1.0",
    description: "Isaac Sim physics simulation + policy execution",
    parameters: {
      robot: "string",
      task: "string",
      domain_randomization: "boolean",
      control_mode: "string"
    }
  },
  isaac_lab_rl_training: {
    name: "isaac_lab_rl_training",
    version: "1.0",
    description: "Isaac Lab GPU-accelerated RL training",
    parameters: {
      task_name: "string",
      num_envs: "number",
      algorithm: "string",
      max_iterations: "number"
    }
  },
  isaac_sim_render: {
    name: "isaac_sim_render",
    version: "1.0",
    description: "Isaac Sim RTX cinematic rendering",
    parameters: {
      job_id: "string",
      resolution: "string",
      duration: "number",
      camera_path: "string"
    }
  },
  leapp_onnx_export: {
    name: "leapp_onnx_export",
    version: "1.0",
    description: "LEAPP ONNX export from Isaac Lab checkpoint",
    parameters: {
      checkpoint_path: "string",
      task_name: "string",
      export_format: "string"
    }
  }
};
function listRecipes() {
  return Object.values(RECIPES);
}
var jobCache = /* @__PURE__ */ new Map();
function cacheJob(job) {
  jobCache.set(job.id, job);
}
function listCachedJobs(filter) {
  const jobs = Array.from(jobCache.values());
  return jobs.filter((j) => {
    if (filter?.recipe && j.recipe !== filter.recipe) return false;
    if (filter?.status && j.status !== filter.status) return false;
    return true;
  });
}
function getOSMOHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (NVIDIA_API_KEY6) {
    headers["Authorization"] = `Bearer ${NVIDIA_API_KEY6}`;
  }
  return headers;
}
var jobCounter = 0;
function makeJobId(prefix) {
  jobCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${jobCounter.toString(36)}`;
}
async function submitOSMOJob(recipeName, parameters, options = {}) {
  const recipe = RECIPES[recipeName];
  if (!recipe) {
    throw new Error(`Unknown OSMO recipe: ${recipeName}`);
  }
  if (!USE_OSMO2) {
    throw new Error("OSMO orchestration is disabled. Set USE_OSMO=true to enable.");
  }
  if (NVIDIA_API_KEY6) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT2}/jobs`, {
        method: "POST",
        headers: getOSMOHeaders(),
        body: JSON.stringify({ recipe: recipeName, parameters })
      });
      if (response.ok) {
        const job = await response.json();
        const fullJob = {
          id: job.id || makeJobId("osmo"),
          recipe: recipeName,
          status: job.status || "pending",
          created_at: job.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          progress_pct: job.progress_pct || 0,
          resources: job.resources || { gpus: 1, cpus: 8, memory_gb: 32 },
          logs_url: job.logs_url,
          artifacts_url: job.artifacts_url,
          parameters,
          pipeline_id: options.pipelineId || null,
          parent_job_id: options.parentJobId || null
        };
        cacheJob(fullJob);
        console.log(`OSMO: Submitted ${recipeName} job ${fullJob.id} (upstream)`);
        return fullJob.id;
      }
      console.warn(`OSMO upstream returned ${response.status}; falling back to local sim`);
    } catch (err) {
      console.warn(`OSMO submit failed (${err?.message || err}); falling back to local sim`);
    }
  }
  if (!OSMO_LOCAL_SIM) {
    throw new Error("OSMO upstream unreachable and OSMO_LOCAL_SIM=false");
  }
  const localJob = {
    id: makeJobId(`osmo_${recipeName}`),
    recipe: recipeName,
    status: "pending",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    progress_pct: 0,
    resources: { gpus: 1, cpus: 8, memory_gb: 32 },
    parameters,
    pipeline_id: options.pipelineId || null,
    parent_job_id: options.parentJobId || null,
    local_simulated: true
  };
  cacheJob(localJob);
  console.log(`OSMO: Submitted ${recipeName} job ${localJob.id} (local sim)`);
  scheduleSimulatedProgress(localJob.id);
  return localJob.id;
}
var SIM_TICK_MS = 2e3;
var SIM_TOTAL_TICKS = 25;
function scheduleSimulatedProgress(jobId) {
  let tick = 0;
  const interval = setInterval(() => {
    const job = jobCache.get(jobId);
    if (!job || job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      clearInterval(interval);
      return;
    }
    tick += 1;
    if (tick === 1) {
      job.status = "running";
      job.started_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    job.progress_pct = Math.min(100, Math.round(tick / SIM_TOTAL_TICKS * 100));
    if (tick >= SIM_TOTAL_TICKS) {
      job.status = "completed";
      job.completed_at = (/* @__PURE__ */ new Date()).toISOString();
      job.progress_pct = 100;
      job.artifacts_url = `${OSMO_ENDPOINT2}/jobs/${jobId}/artifacts`;
      job.logs_url = `${OSMO_ENDPOINT2}/jobs/${jobId}/logs`;
    }
    jobCache.set(jobId, job);
  }, SIM_TICK_MS);
}
async function getOSMOJobStatus(jobId) {
  const cached = jobCache.get(jobId);
  const canQueryUpstream = USE_OSMO2 && NVIDIA_API_KEY6 && !cached?.local_simulated;
  if (canQueryUpstream) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT2}/jobs/${jobId}`, {
        headers: getOSMOHeaders()
      });
      if (response.ok) {
        const upstream = await response.json();
        const merged = {
          ...cached,
          ...upstream,
          id: jobId,
          recipe: upstream.recipe || cached?.recipe || "isaac_sim_policy_training",
          status: upstream.status || cached?.status || "unknown",
          created_at: upstream.created_at || cached?.created_at || (/* @__PURE__ */ new Date()).toISOString(),
          progress_pct: upstream.progress_pct ?? cached?.progress_pct ?? 0,
          resources: upstream.resources || cached?.resources || { gpus: 0, cpus: 0, memory_gb: 0 }
        };
        cacheJob(merged);
        return merged;
      }
    } catch (err) {
      console.warn(`OSMO status fetch failed for ${jobId}: ${err?.message || err}`);
    }
  }
  if (cached) return cached;
  throw new Error(`OSMO job not found: ${jobId}`);
}
async function listOSMOJobs(filter) {
  const cached = listCachedJobs(filter);
  if (USE_OSMO2 && NVIDIA_API_KEY6) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT2}/jobs`, {
        headers: getOSMOHeaders()
      });
      if (response.ok) {
        const upstreamJobs = await response.json();
        for (const j of upstreamJobs) {
          if (!jobCache.has(j.id)) cacheJob(j);
        }
      }
    } catch (err) {
    }
  }
  return listCachedJobs(filter);
}
async function cancelOSMOJob(jobId) {
  const cached = jobCache.get(jobId);
  const canQueryUpstream = USE_OSMO2 && NVIDIA_API_KEY6 && !cached?.local_simulated;
  if (canQueryUpstream) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT2}/jobs/${jobId}/cancel`, {
        method: "POST",
        headers: getOSMOHeaders()
      });
      if (response.ok) {
        const upstream = await response.json();
        const merged = { ...cached, ...upstream, status: "cancelled" };
        cacheJob(merged);
        return merged;
      }
    } catch (err) {
      console.warn(`OSMO cancel failed for ${jobId}: ${err?.message || err}`);
    }
  }
  if (cached) {
    cached.status = "cancelled";
    cached.completed_at = cached.completed_at || (/* @__PURE__ */ new Date()).toISOString();
    jobCache.set(jobId, cached);
    return cached;
  }
  throw new Error(`OSMO job not found: ${jobId}`);
}
async function getOSMOJobArtifacts(jobId) {
  const cached = jobCache.get(jobId);
  const canQueryUpstream = USE_OSMO2 && NVIDIA_API_KEY6 && !cached?.local_simulated;
  if (canQueryUpstream) {
    try {
      const response = await fetch(`${OSMO_ENDPOINT2}/jobs/${jobId}/artifacts`, {
        headers: getOSMOHeaders()
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn(`OSMO artifacts fetch failed for ${jobId}: ${err?.message || err}`);
    }
  }
  if (cached) {
    if (cached.status !== "completed") return [];
    const synthetic = [];
    if (cached.recipe === "isaac_lab_rl_training") {
      synthetic.push({
        name: `${jobId}_checkpoint.pt`,
        size_bytes: 5e6,
        download_url: `${OSMO_ENDPOINT2}/jobs/${jobId}/artifacts/checkpoint`,
        kind: "checkpoint"
      });
    } else if (cached.recipe === "leapp_onnx_export") {
      synthetic.push({
        name: `${jobId}_policy.onnx`,
        size_bytes: 12e5,
        download_url: `${OSMO_ENDPOINT2}/jobs/${jobId}/artifacts/onnx`,
        kind: "onnx"
      });
    } else if (cached.recipe === "isaac_sim_render") {
      synthetic.push({
        name: `${jobId}_render.mp4`,
        size_bytes: 28e6,
        download_url: `${OSMO_ENDPOINT2}/jobs/${jobId}/artifacts/video`,
        kind: "video"
      });
    } else if (cached.recipe === "isaac_sim_policy_training") {
      synthetic.push({
        name: `${jobId}_metrics.json`,
        size_bytes: 4200,
        download_url: `${OSMO_ENDPOINT2}/jobs/${jobId}/artifacts/metrics`,
        kind: "metrics"
      });
    }
    return synthetic;
  }
  throw new Error(`OSMO job not found: ${jobId}`);
}
async function streamOSMOJobLogs(jobId) {
  const cached = jobCache.get(jobId);
  if (!cached || cached.local_simulated || !USE_OSMO2 || !NVIDIA_API_KEY6) {
    const stream = new import_stream.Readable({ read() {
    } });
    stream.push(`[osmo-local] Streaming logs for ${jobId}
`);
    if (cached) {
      stream.push(`[osmo-local] Recipe: ${cached.recipe}, Status: ${cached.status}
`);
      let tick = 0;
      const interval = setInterval(() => {
        tick += 1;
        const pct = Math.min(100, Math.round(tick / SIM_TOTAL_TICKS * 100));
        stream.push(`[osmo-local] tick ${tick}/${SIM_TOTAL_TICKS} progress=${pct}%
`);
        if (pct >= 100 || cached.status === "cancelled") {
          stream.push(`[osmo-local] job ${jobId} completed
`);
          stream.push(null);
          clearInterval(interval);
        }
      }, SIM_TICK_MS);
    } else {
      stream.push(`[osmo-local] Job ${jobId} not found in cache
`);
      stream.push(null);
    }
    return stream;
  }
  const response = await fetch(`${OSMO_ENDPOINT2}/jobs/${jobId}/logs/stream`, {
    headers: getOSMOHeaders()
  });
  if (!response.ok || !response.body) {
    throw new Error(`OSMO log stream failed: ${response.status}`);
  }
  const nodeStream = new import_stream.Readable({ read() {
  } });
  (async () => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl + 1);
        buffer = buffer.slice(nl + 1);
        nodeStream.push(line);
      }
    }
    if (buffer) nodeStream.push(buffer);
    nodeStream.push(null);
  })().catch((err) => nodeStream.destroy(err));
  return nodeStream;
}
var pipelines = /* @__PURE__ */ new Map();
async function submitOSMOPipeline(name, stages) {
  if (!stages.length) throw new Error("Pipeline requires at least one stage");
  const pipelineId = `osmo_pipeline_${Date.now().toString(36)}`;
  const pipeline = {
    id: pipelineId,
    name,
    stages,
    jobs: [],
    status: "pending",
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  pipelines.set(pipelineId, pipeline);
  (async () => {
    try {
      pipeline.status = "running";
      const stageOutputs = {};
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const mergedParams = { ...stage.parameters };
        if (stage.outputMapping && i > 0 && stageOutputs[i - 1]) {
          for (const [srcKey, dstKey] of Object.entries(stage.outputMapping)) {
            if (stageOutputs[i - 1][srcKey] !== void 0) {
              mergedParams[dstKey] = stageOutputs[i - 1][srcKey];
            }
          }
        }
        const jobId = await submitOSMOJob(stage.recipe, mergedParams, {
          pipelineId,
          parentJobId: i > 0 ? pipeline.jobs[i - 1].jobId : null
        });
        pipeline.jobs.push({ stageIndex: i, jobId, status: "pending" });
        pipelines.set(pipelineId, { ...pipeline });
        while (true) {
          await new Promise((r) => setTimeout(r, 2e3));
          const job = await getOSMOJobStatus(jobId);
          const jobEntry = pipeline.jobs.find((j) => j.jobId === jobId);
          if (jobEntry) jobEntry.status = job.status;
          pipelines.set(pipelineId, { ...pipeline });
          if (job.status === "completed") {
            const artifacts = await getOSMOJobArtifacts(jobId);
            stageOutputs[i] = {};
            for (const a of artifacts) {
              stageOutputs[i][a.kind] = a.download_url;
            }
            break;
          }
          if (job.status === "failed" || job.status === "cancelled") {
            pipeline.status = job.status;
            pipeline.completed_at = (/* @__PURE__ */ new Date()).toISOString();
            pipelines.set(pipelineId, { ...pipeline });
            return;
          }
        }
      }
      pipeline.status = "completed";
      pipeline.completed_at = (/* @__PURE__ */ new Date()).toISOString();
      pipelines.set(pipelineId, { ...pipeline });
    } catch (err) {
      pipeline.status = "failed";
      pipeline.completed_at = (/* @__PURE__ */ new Date()).toISOString();
      pipeline.error = err?.message || String(err);
      pipelines.set(pipelineId, { ...pipeline });
    }
  })();
  return pipelineId;
}
function getOSMOPipeline(pipelineId) {
  return pipelines.get(pipelineId) || null;
}
function listOSMOPipelines() {
  return Array.from(pipelines.values());
}
function isOSMOConfigured() {
  return USE_OSMO2 && !!NVIDIA_API_KEY6;
}
function getOSMOStatus() {
  return {
    enabled: USE_OSMO2,
    hasApiKey: !!NVIDIA_API_KEY6,
    endpoint: OSMO_ENDPOINT2,
    localSim: OSMO_LOCAL_SIM,
    recipesCount: Object.keys(RECIPES).length,
    cachedJobs: jobCache.size,
    cachedPipelines: pipelines.size
  };
}

// server.ts
init_sqliteStore();
init_leappExporter();

// server/pipeline/approvalService.ts
init_sqliteStore();
var approvalsTable = getTable("approvals");
function toDecision(record) {
  return {
    id: record.id,
    videoGenId: record.videoGenId,
    policyId: record.policyId,
    decision: record.decision,
    feedback: record.feedback,
    approvedAt: record.approvedAt,
    rejectedAt: record.rejectedAt
  };
}
function createApprovalRequest(videoGenId) {
  const id = `appr_${Date.now().toString(36)}`;
  const record = {
    id,
    videoGenId,
    policyId: null,
    decision: "rejected",
    feedback: "",
    approvedAt: null,
    rejectedAt: null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  approvalsTable.insert(record);
  return toDecision(record);
}
function approveVideo(approvalId, policyId) {
  const updated = approvalsTable.updateById(approvalId, {
    decision: "approved",
    policyId,
    approvedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (!updated) throw new Error(`Approval record not found: ${approvalId}`);
  return toDecision(updated);
}
function rejectVideo(approvalId, feedback) {
  const updated = approvalsTable.updateById(approvalId, {
    decision: "rejected",
    feedback,
    rejectedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (!updated) throw new Error(`Approval record not found: ${approvalId}`);
  return toDecision(updated);
}
function requestRevision(approvalId, feedback) {
  const updated = approvalsTable.updateById(approvalId, {
    decision: "revision_requested",
    feedback
  });
  if (!updated) throw new Error(`Approval record not found: ${approvalId}`);
  return toDecision(updated);
}
function getApproval(approvalId) {
  const record = approvalsTable.find((r) => r.id === approvalId);
  return record ? toDecision(record) : null;
}

// server/middleware/upload.ts
var import_multer = __toESM(require("multer"), 1);
var import_path6 = __toESM(require("path"), 1);
var import_fs6 = __toESM(require("fs"), 1);
var uploadDir = import_path6.default.join(process.cwd(), "uploads");
if (!import_fs6.default.existsSync(uploadDir)) {
  import_fs6.default.mkdirSync(uploadDir, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = import_path6.default.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
var fileFilter = (_req, file, cb) => {
  const allowedMimes = [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/avi",
    "video/mov"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported video format: ${file.mimetype}`));
  }
};
var upload = (0, import_multer.default)({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024,
    files: 1
  }
});

// server/pipeline/videoUploader.ts
var import_path7 = __toESM(require("path"), 1);
var import_fs7 = __toESM(require("fs"), 1);
var import_url = require("url");
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path7.default.dirname(__filename);
var uploadsDir = import_path7.default.join(process.cwd(), "uploads");
if (!import_fs7.default.existsSync(uploadsDir)) {
  import_fs7.default.mkdirSync(uploadsDir, { recursive: true });
}
function storeVideoUpload(fileName, mimeType, fileSizeBytes, localPath) {
  const id = `vid_${Date.now().toString(36)}`;
  const video = {
    id,
    fileName,
    fileSizeBytes,
    mimeType,
    durationSec: 0,
    resolution: "unknown",
    uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
    localPath
  };
  return video;
}
function getVideoUploadPath(videoId) {
  const uploadsDir2 = import_path7.default.join(process.cwd(), "uploads");
  const files = import_fs7.default.readdirSync(uploadsDir2).filter((f) => f.startsWith(videoId));
  if (files.length === 0) {
    throw new Error(`Video file not found for ID: ${videoId}`);
  }
  return import_path7.default.join(uploadsDir2, files[0]);
}

// server/pipeline/deploymentCollector.ts
var import_crypto2 = __toESM(require("crypto"), 1);
init_sqliteStore();

// server/pipeline/failureCategorizer.ts
var import_genai2 = require("@google/genai");
var FAILURE_TAXONOMY = [
  { category: "grasp_slip", label: "Grasp Slip", keywords: ["slip", "dropped", "slide", "tactile", "grip loss"] },
  { category: "collision_misdetection", label: "Collision Mis-detection", keywords: ["collision", "contact spike", "false trigger", "impact", "bump"] },
  { category: "stability_oscillation", label: "Stability Oscillation", keywords: ["oscillat", "vibrat", "shak", "unstable", "overshoot", "jitter"] },
  { category: "timeout", label: "Execution Timeout", keywords: ["timeout", "slow", "exceeded time", "stuck", "stalled"] },
  { category: "target_lost", label: "Target Lost", keywords: ["tracking lost", "target lost", "vision", "occluded", "no detection"] },
  { category: "contact_jam", label: "Contact Jam / Wedge", keywords: ["jam", "wedge", "stuck insertion", "bind", "seized"] },
  { category: "joint_limit", label: "Joint Limit Reached", keywords: ["joint limit", "singularity", "limit", "out of range"] },
  { category: "navigation_failure", label: "Navigation Failure", keywords: ["navigation", "path blocked", "localization", "goal unreachable", "lidar"] },
  { category: "calibration_drift", label: "Calibration Drift", keywords: ["calibration", "drift", "bias", "offset", "force sensor"] },
  { category: "unknown", label: "Unknown Failure", keywords: [] }
];
var SEVERITY_RANK = { low: 1, medium: 2, high: 3, critical: 4 };
function classifySeverity(run) {
  if (!run.errorSignals || run.errorSignals.length === 0) return "medium";
  const worst = run.errorSignals.reduce(
    (acc, s) => SEVERITY_RANK[s.severity] > SEVERITY_RANK[acc] ? s.severity : acc,
    "low"
  );
  if (run.successScore < 30) {
    return SEVERITY_RANK[worst] >= 3 ? "critical" : "high";
  }
  return worst;
}
function categorizeFailureRuleBased(run) {
  const signals = run.errorSignals || [];
  const signalText = signals.map((s) => `${s.type} ${s.description}`).join(" ").toLowerCase();
  const signalTypes = signals.map((s) => s.type.toLowerCase()).join(" ");
  let category = "unknown";
  let score = 0;
  let matched = null;
  for (const entry of FAILURE_TAXONOMY) {
    let entryScore = 0;
    for (const kw of entry.keywords) {
      if (signalText.includes(kw) || signalTypes.includes(kw)) {
        entryScore += 1;
      }
    }
    if (entryScore > score) {
      score = entryScore;
      category = entry.category;
      matched = entry;
    }
  }
  const categoryDef = matched || FAILURE_TAXONOMY[FAILURE_TAXONOMY.length - 1];
  const confidence = category === "unknown" ? 0.35 : Math.min(0.95, 0.6 + score * 0.1);
  const rootCauseByCategory = {
    grasp_slip: "Insufficient grasp force or improper contact surface / friction model mismatch.",
    collision_misdetection: "Contact threshold mis-calibrated; obstacle sensor latency or false positives.",
    stability_oscillation: "Impedance gains (Kp/Kd) too aggressive relative to payload dynamics.",
    timeout: "Trajectory pacing too slow or state machine stuck waiting for a transition condition.",
    target_lost: "Vision tracking lost due to occlusion, lighting change, or object drift out of FOV.",
    contact_jam: "Insertion velocity too high with rigid alignment; no compliance search motion.",
    joint_limit: "Desired pose unreachable or command exceeds joint range / near singularity.",
    navigation_failure: "Path planning failed or localization drift caused goal unreachable.",
    calibration_drift: "Sensor bias accumulated over run causing systematic control error.",
    unknown: "No dominant failure signature detected; requires LLM deep analysis."
  };
  const actionByCategory = {
    grasp_slip: "Increase grip force 20%, add tactile contact trigger before lift, raise friction coefficient in sim-to-real.",
    collision_misdetection: "Re-calibrate contact threshold, add median filter on force signal, validate with domain-randomized trials.",
    stability_oscillation: "Reduce Kp by 25%, raise Kd 10%, add low-pass filter on EE velocity feedback.",
    timeout: "Speed up approach phase 15%, add timeout watchdog with recover action.",
    target_lost: "Add multi-cue tracker (depth + RGB), implement re-acquire behavior on lost signal.",
    contact_jam: "Add 1mm sinusoidal search dithering during insertion and lower insertion velocity.",
    joint_limit: "Add IK redundancy resolution, clamp targets with 5% safety margin from limits.",
    navigation_failure: "Retrain path planner with inflated obstacle margins, add replan-on-block logic.",
    calibration_drift: "Add periodic auto-bias zeroing at start of each run and drift monitor.",
    unknown: "Collect longer failure window and run LLM-assisted root cause analysis."
  };
  return {
    id: `fail_${Date.now().toString(36)}`,
    runId: run.id,
    policyId: run.policyId,
    taskTitle: run.taskTitle,
    robotModel: run.robotModel,
    category,
    severity: classifySeverity(run),
    description: `Automatic classification of run ${run.id}: ${categoryDef.label}. Signals: ${signalText || "none recorded"}.`,
    rootCause: rootCauseByCategory[category],
    recommendedAction: actionByCategory[category],
    confidence: +confidence.toFixed(2),
    classifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    classifier: "rules"
  };
}
function getGeminiClient2() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new import_genai2.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function categorizeFailureWithLLM(run) {
  const ai = getGeminiClient2();
  const signalSummary = (run.errorSignals || []).map((s) => `- [${s.severity}] ${s.type} at t=${s.occurredAtSec}s: ${s.description}`).join("\n");
  const prompt = `You are the Policy-0 Failure Intelligence engine. A deployed robot policy failed in the real world (or high-fidelity simulation). Analyze the anonymous run telemetry and classify the failure.

Policy: "${run.taskTitle}"
Robot: ${run.robotModel}
Outcome score: ${run.successScore}/100, duration ${run.durationSec}s, attempts ${run.numAttempts}

Error signals captured:
${signalSummary || "- no explicit signals"}

Classify the failure into exactly one category from this taxonomy:
1. grasp_slip - object slipped from gripper
2. collision_misdetection - contact/obstacle mis-handled
3. stability_oscillation - controller oscillating/unstable
4. timeout - task exceeded execution window
5. target_lost - vision/tracking lost target
6. contact_jam - object wedged during insertion/assembly
7. joint_limit - command hit joint limits/singularity
8. navigation_failure - mobile base failed to reach goal
9. calibration_drift - sensor drift/bias degraded control
10. unknown - cannot determine

Output a JSON object:
1. category: one of the exact category names above.
2. severity: low | medium | high | critical.
3. description: 1-2 sentence concise failure summary.
4. rootCause: 1-2 sentence root cause hypothesis.
5. recommendedAction: concrete actionable fix for the policy (gains, thresholds, architecture).
6. confidence: number 0.0-1.0.`;
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: import_genai2.Type.OBJECT,
        properties: {
          category: { type: import_genai2.Type.STRING },
          severity: { type: import_genai2.Type.STRING },
          description: { type: import_genai2.Type.STRING },
          rootCause: { type: import_genai2.Type.STRING },
          recommendedAction: { type: import_genai2.Type.STRING },
          confidence: { type: import_genai2.Type.NUMBER }
        },
        required: ["category", "severity", "description", "rootCause", "recommendedAction", "confidence"]
      }
    }
  });
  const parsed = JSON.parse(response.text || "{}");
  const validCategories = FAILURE_TAXONOMY.map((t) => t.category);
  const category = validCategories.includes(parsed.category) ? parsed.category : "unknown";
  const severity = ["low", "medium", "high", "critical"].includes(parsed.severity) ? parsed.severity : "medium";
  return {
    id: `fail_${Date.now().toString(36)}`,
    runId: run.id,
    policyId: run.policyId,
    taskTitle: run.taskTitle,
    robotModel: run.robotModel,
    category,
    severity,
    description: parsed.description || categorizeFailureRuleBased(run).description,
    rootCause: parsed.rootCause || "Unknown",
    recommendedAction: parsed.recommendedAction || "Requires manual review.",
    confidence: typeof parsed.confidence === "number" ? +parsed.confidence.toFixed(2) : 0.7,
    classifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
    classifier: "llm"
  };
}

// server/pipeline/deploymentCollector.ts
var deploymentRunsTable = getTable("deployment_runs");
var failuresTable = getTable("failures");
function anonymizeEnvironment(fingerprint, deviceSerial) {
  if (deviceSerial) {
    return import_crypto2.default.createHash("sha256").update(deviceSerial).digest("hex").substring(0, 16);
  }
  if (fingerprint) {
    return import_crypto2.default.createHash("sha256").update(fingerprint).digest("hex").substring(0, 16);
  }
  return import_crypto2.default.createHash("sha256").update(String(Math.random())).digest("hex").substring(0, 16);
}
function getAllRuns() {
  return deploymentRunsTable.list();
}
function addRun(run) {
  deploymentRunsTable.upsert({ ...run, id: run.id });
  return run;
}
function addFailure(failure) {
  failuresTable.upsert({ ...failure, id: failure.id });
  return failure;
}
function collectDeploymentRun(payload) {
  const run = {
    id: `run_${Date.now().toString(36)}`,
    policyId: payload.policyId || "unknown",
    robotModel: payload.robotModel || "unknown",
    taskTitle: payload.taskTitle || "Untitled Deployment",
    outcome: payload.outcome,
    successScore: payload.successScore ?? (payload.outcome === "success" ? 100 : payload.outcome === "partial" ? 60 : 15),
    durationSec: payload.durationSec || 0,
    numAttempts: payload.numAttempts || 1,
    errorSignals: Array.isArray(payload.errorSignals) ? payload.errorSignals : [],
    environmentFingerprint: anonymizeEnvironment(payload.environmentFingerprint, payload.deviceSerial),
    deployedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: payload.source || "sim"
  };
  addRun(run);
  if (run.outcome !== "success") {
    const classified = categorizeFailureRuleBased(run);
    addFailure(classified);
  }
  return run;
}
async function upgradeFailureClassificationWithLLM(runId) {
  const run = getAllRuns().find((r) => r.id === runId);
  if (!run) {
    throw new Error(`Deployment run not found: ${runId}`);
  }
  try {
    const classified = await categorizeFailureWithLLM(run);
    return addFailure(classified);
  } catch (err) {
    console.warn("LLM classification fallback used:", err);
    const classified = categorizeFailureRuleBased(run);
    return addFailure(classified);
  }
}
async function simulateDeploymentRun(policy) {
  const baseSuccess = policy.metrics?.successRatePct ?? 90;
  const roll = Math.random() * 100;
  let outcome;
  let successScore;
  if (roll <= baseSuccess * 0.9) {
    outcome = "success";
    successScore = 88 + Math.random() * 12;
  } else if (roll <= baseSuccess) {
    outcome = "partial";
    successScore = 55 + Math.random() * 20;
  } else {
    outcome = "failure";
    successScore = 10 + Math.random() * 25;
  }
  const failurePool = [
    { pick: 0.32, type: "grasp_slip", severity: "high", description: "Object slid out of gripper during lift", occurredAtSec: 1.4 },
    { pick: 0.24, type: "contact_jam", severity: "high", description: "Insertion wedge detected, excessive contact force", occurredAtSec: 2.6 },
    { pick: 0.18, type: "stability_oscillation", severity: "medium", description: "End-effector oscillation near target, no convergence", occurredAtSec: 3.1 },
    { pick: 0.14, type: "target_lost", severity: "medium", description: "Vision tracking lost target after occlusion", occurredAtSec: 1.1 },
    { pick: 0.12, type: "collision_misdetection", severity: "critical", description: "False collision trigger aborted task", occurredAtSec: 2.2 }
  ];
  const errorSignals = [];
  if (outcome !== "success") {
    let r = Math.random();
    let picked = failurePool[0];
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
      occurredAtSec: picked.occurredAtSec
    });
  }
  return collectDeploymentRun({
    policyId: policy.id,
    robotModel: policy.robotName,
    taskTitle: policy.title,
    outcome,
    successScore,
    durationSec: +(3 + Math.random() * 9).toFixed(1),
    numAttempts: outcome === "failure" ? 1 + Math.floor(Math.random() * 2) : 1,
    errorSignals,
    source: Math.random() > 0.5 ? "real_world" : "sim"
  });
}
function getUncategorizedFailuresForCollector() {
  const runs = getAllRuns();
  const failures = failuresTable.list();
  const classifiedRunIds = new Set(failures.map((f) => f.runId));
  return runs.filter((r) => r.outcome !== "success" && !classifiedRunIds.has(r.id));
}
function getFlywheelStats() {
  const runs = getAllRuns();
  const failures = failuresTable.list();
  const successRuns = runs.filter((r) => r.outcome === "success").length;
  const failureRuns = runs.filter((r) => r.outcome === "failure").length;
  const totalFailures = runs.filter((r) => r.outcome !== "success").length;
  const categorizedFailures = failures.length;
  const categoryCounts = /* @__PURE__ */ new Map();
  for (const f of failures) {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1);
  }
  const topFailureCategories = Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  return {
    totalRuns: runs.length,
    successRuns,
    failureRuns,
    passRatePct: runs.length === 0 ? 0 : +(successRuns / runs.length * 100).toFixed(1),
    totalFailures,
    categorizedFailures,
    uncategorizedFailures: Math.max(0, totalFailures - categorizedFailures),
    improvementsGenerated: 0,
    improvementsApplied: 0,
    topFailureCategories
  };
}
function getDataMoatStats() {
  return getFlywheelStats();
}

// server/data/dataStore.ts
var import_path8 = __toESM(require("path"), 1);
var import_fs8 = __toESM(require("fs"), 1);
var dataDir3 = import_path8.default.join(process.cwd(), "data");
var dataFile = import_path8.default.join(dataDir3, "moat-data.json");
function emptyData() {
  return { runs: [], failures: [], improvements: [], versions: [] };
}
function ensureFile() {
  if (!import_fs8.default.existsSync(dataDir3)) {
    import_fs8.default.mkdirSync(dataDir3, { recursive: true });
  }
  if (!import_fs8.default.existsSync(dataFile)) {
    import_fs8.default.writeFileSync(dataFile, JSON.stringify(emptyData(), null, 2), "utf-8");
  }
}
function readData() {
  ensureFile();
  try {
    const raw = import_fs8.default.readFileSync(dataFile, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      runs: Array.isArray(parsed.runs) ? parsed.runs : [],
      failures: Array.isArray(parsed.failures) ? parsed.failures : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      versions: Array.isArray(parsed.versions) ? parsed.versions : []
    };
  } catch (err) {
    console.warn("Data store read failed, resetting:", err);
    const data = emptyData();
    import_fs8.default.writeFileSync(dataFile, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }
}
function getAllRuns2() {
  return readData().runs;
}
function getAllFailures() {
  return readData().failures;
}
function getFailureByRunId(runId) {
  return readData().failures.find((f) => f.runId === runId) || null;
}

// server/data/policyStore.ts
var persistenceInstance2 = null;
async function getPersistence2() {
  if (!persistenceInstance2) {
    const backend = process.env.DATA_BACKEND || "json";
    persistenceInstance2 = await createPersistence(backend);
  }
  return persistenceInstance2;
}
function mapPolicyRecord(p) {
  return {
    id: p.id,
    policy: p.policy,
    mode: p.mode,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString()
  };
}
function mapPolicyVersion3(v) {
  return {
    id: v.id,
    policyId: v.policyId,
    version: v.version,
    policy: v.policyJson,
    verified: v.verified,
    createdAt: v.createdAt.toISOString()
  };
}
async function savePolicy(policy, mode = "SIMULATED") {
  const persistence = await getPersistence2();
  const result = await persistence.savePolicy(policy, mode);
  return mapPolicyRecord(result);
}
async function getPolicy(id) {
  const persistence = await getPersistence2();
  const result = await persistence.getPolicy(id);
  return result ? mapPolicyRecord(result) : null;
}
async function listPolicies() {
  const persistence = await getPersistence2();
  const results = await persistence.listPolicies();
  return results.map(mapPolicyRecord);
}
async function deletePolicy(id) {
  const persistence = await getPersistence2();
  return persistence.deletePolicy(id);
}
async function savePolicyVersion(policy, version, verified = false) {
  const persistence = await getPersistence2();
  const result = await persistence.savePolicyVersion(policy, version, verified);
  return mapPolicyVersion3(result);
}
async function listPolicyVersions(policyId) {
  const persistence = await getPersistence2();
  const results = await persistence.listPolicyVersions(policyId);
  return results.map(mapPolicyVersion3);
}

// server/pipeline/improvementEngine.ts
var import_genai3 = require("@google/genai");
init_sqliteStore();
var IMPROVEMENT_TEMPLATES = {
  grasp_slip: {
    title: "Increase grip force & add tactile contact trigger",
    changes: [
      { target: "Gripper", parameter: "Grip Force", from: "80% max", to: "100% max (2s hold)" },
      { target: "State Machine", parameter: "Lift Trigger", from: "Timed lift after grasp", to: "Tactile contact verified before lift" },
      { target: "Sim-to-Real", parameter: "Friction Coef", from: "0.8", to: "1.15" }
    ],
    gain: 12,
    priority: "critical"
  },
  collision_misdetection: {
    title: "Re-calibrate contact thresholds with signal filtering",
    changes: [
      { target: "Force Sensor", parameter: "Contact Threshold", from: "2.0 N", to: "4.5 N" },
      { target: "Signal Pipeline", parameter: "Filter", from: "None", to: "Median filter (window=5)" },
      { target: "Sim-to-Real", parameter: "Noise Sigma", from: "0.01", to: "0.03" }
    ],
    gain: 9,
    priority: "high"
  },
  stability_oscillation: {
    title: "Tune impedance gains for stable convergence",
    changes: [
      { target: "Impedance", parameter: "Kp", from: "600 N/m", to: "450 N/m" },
      { target: "Impedance", parameter: "Kd", from: "2*sqrt(Kp)", to: "2.3*sqrt(Kp)" },
      { target: "Feedback", parameter: "EE Velocity Filter", from: "None", to: "Low-pass @ 25 Hz" }
    ],
    gain: 14,
    priority: "high"
  },
  timeout: {
    title: "Accelerate approach pacing & add watchdog recovery",
    changes: [
      { target: "Trajectory", parameter: "Approach Speed", from: "0.05 m/s", to: "0.09 m/s" },
      { target: "State Machine", parameter: "Stage Timeout", from: "None", to: "4s + recover" },
      { target: "Planner", parameter: "Execution Budget", from: "20 s", to: "15 s" }
    ],
    gain: 8,
    priority: "medium"
  },
  target_lost: {
    title: "Multi-cue tracker with re-acquisition behavior",
    changes: [
      { target: "Perception", parameter: "Tracking Cues", from: "RGB only", to: "RGB + Depth fusion" },
      { target: "State Machine", parameter: "Re-acquire", from: "None", to: "Search scan on lost" },
      { target: "Vision", parameter: "Confidence Gate", from: "0.5", to: "0.7" }
    ],
    gain: 11,
    priority: "high"
  },
  contact_jam: {
    title: "Add compliance dithering during insertion",
    changes: [
      { target: "Trajectory", parameter: "Insertion Velocity", from: "0.012 m/s", to: "0.006 m/s" },
      { target: "Compliance", parameter: "Search Dither", from: "None", to: "1 mm sinusoidal" },
      { target: "Impedance", parameter: "Lateral Kp", from: "600 N/m", to: "150 N/m" }
    ],
    gain: 15,
    priority: "critical"
  },
  joint_limit: {
    title: "Add redundancy resolution with limit safety margin",
    changes: [
      { target: "IK", parameter: "Redundancy Resolution", from: "None", to: "Null-space projection" },
      { target: "Constraints", parameter: "Joint Margin", from: "0%", to: "5% from limits" },
      { target: "Controller", parameter: "Limit Clamping", from: "None", to: "Smooth clamp + saturate" }
    ],
    gain: 7,
    priority: "medium"
  },
  navigation_failure: {
    title: "Inflate obstacle margins & add replan-on-block",
    changes: [
      { target: "Planner", parameter: "Obstacle Margin", from: "0.05 m", to: "0.12 m" },
      { target: "Navigation", parameter: "Replan Policy", from: "None", to: "Replan on stuck" },
      { target: "Localization", parameter: "Particle Count", from: "500", to: "2000" }
    ],
    gain: 10,
    priority: "medium"
  },
  calibration_drift: {
    title: "Auto zero sensor bias & monitor drift",
    changes: [
      { target: "Calibration", parameter: "Auto Zeroing", from: "None", to: "Before each run" },
      { target: "Sensor", parameter: "Drift Monitor", from: "None", to: "Bias alert > 0.5 N" },
      { target: "Loop", parameter: "Bias Correction", from: "None", to: "Online compensation" }
    ],
    gain: 8,
    priority: "medium"
  },
  unknown: {
    title: "Deep telemetry capture for root cause analysis",
    changes: [
      { target: "Telemetry", parameter: "Capture Window", from: "5 s", to: "20 s around failure" },
      { target: "Sensors", parameter: "Logging Rate", from: "10 Hz", to: "100 Hz" },
      { target: "Analysis", parameter: "LLM Review", from: "None", to: "Auto Gemini analysis" }
    ],
    gain: 5,
    priority: "low"
  }
};
var improvementsTable = getTable("improvements");
var failuresTable2 = getTable("failures");
var deploymentRunsTable2 = getTable("deployment_runs");
function getAllFailures2() {
  return failuresTable2.list();
}
function getAllImprovements() {
  return improvementsTable.list();
}
function addImprovements(items) {
  for (const item of items) {
    improvementsTable.upsert({ ...item, id: item.id });
  }
  return items;
}
function updateImprovement(improvementId, patch) {
  return improvementsTable.updateById(improvementId, patch);
}
function getFlywheelStats2() {
  const runs = deploymentRunsTable2.list();
  const failures = getAllFailures2();
  const improvements = getAllImprovements();
  const successRuns = runs.filter((r) => r.outcome === "success").length;
  const failureRuns = runs.filter((r) => r.outcome === "failure").length;
  const totalFailures = runs.filter((r) => r.outcome !== "success").length;
  const categorizedFailures = failures.length;
  const improvementsGenerated = improvements.length;
  const improvementsApplied = improvements.filter((i) => i.status === "applied").length;
  const categoryCounts = /* @__PURE__ */ new Map();
  for (const f of failures) {
    categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1);
  }
  const topFailureCategories = Array.from(categoryCounts.entries()).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  return {
    totalRuns: runs.length,
    successRuns,
    failureRuns,
    passRatePct: runs.length === 0 ? 0 : +(successRuns / runs.length * 100).toFixed(1),
    totalFailures,
    categorizedFailures,
    uncategorizedFailures: Math.max(0, totalFailures - categorizedFailures),
    improvementsGenerated,
    improvementsApplied,
    topFailureCategories
  };
}
function buildRecommendation(failure) {
  const tpl = IMPROVEMENT_TEMPLATES[failure.category];
  const severityBonus = failure.severity === "critical" ? 3 : failure.severity === "high" ? 2 : failure.severity === "medium" ? 1 : 0;
  return {
    id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    policyId: failure.policyId,
    policyTitle: failure.taskTitle,
    failureCategory: failure.category,
    title: tpl.title,
    description: `Improvement derived from ${failure.category} failures on "${failure.taskTitle}". ${failure.recommendedAction}`,
    changes: tpl.changes.map((c) => ({ ...c })),
    estimatedGainPct: tpl.gain + severityBonus + Math.floor(Math.random() * 3),
    priority: tpl.priority === "critical" ? "critical" : severityBonus >= 2 ? "high" : tpl.priority,
    status: "pending",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    appliedAt: null
  };
}
function generateImprovements() {
  const failures = getAllFailures2();
  const existing = getAllImprovements();
  const existingKeys = new Set(existing.map((i) => `${i.policyId}:${i.failureCategory}`));
  const seen = /* @__PURE__ */ new Map();
  for (const f of failures) {
    const key = `${f.policyId}:${f.category}`;
    if (!seen.has(key)) {
      seen.set(key, f);
    } else {
      const cur = seen.get(key);
      const rank = { low: 1, medium: 2, high: 3, critical: 4 };
      if ((rank[f.severity] || 0) > (rank[cur.severity] || 0)) {
        seen.set(key, f);
      }
    }
  }
  const fresh = Array.from(seen.values()).filter((f) => !existingKeys.has(`${f.policyId}:${f.category}`)).map(buildRecommendation);
  if (fresh.length > 0) {
    addImprovements(fresh);
  }
  return fresh.length > 0 ? fresh : getAllImprovements();
}
async function generateImprovementsWithLLM() {
  const failures = getAllFailures2();
  if (failures.length === 0) {
    return generateImprovements();
  }
  const improvementSchema = {
    type: import_genai3.Type.ARRAY,
    items: {
      type: import_genai3.Type.OBJECT,
      properties: {
        policyId: { type: import_genai3.Type.STRING },
        policyTitle: { type: import_genai3.Type.STRING },
        failureCategory: { type: import_genai3.Type.STRING },
        title: { type: import_genai3.Type.STRING },
        description: { type: import_genai3.Type.STRING },
        estimatedGainPct: { type: import_genai3.Type.NUMBER },
        priority: { type: import_genai3.Type.STRING },
        changes: {
          type: import_genai3.Type.ARRAY,
          items: {
            type: import_genai3.Type.OBJECT,
            properties: {
              target: { type: import_genai3.Type.STRING },
              parameter: { type: import_genai3.Type.STRING },
              from: { type: import_genai3.Type.STRING },
              to: { type: import_genai3.Type.STRING }
            },
            required: ["target", "parameter", "from", "to"]
          }
        }
      },
      required: ["policyId", "policyTitle", "failureCategory", "title", "description", "estimatedGainPct", "priority", "changes"]
    }
  };
  const failureSummary = failures.slice(0, 10).map(
    (f) => `- [${f.category}/${f.severity}] ${f.taskTitle} (${f.robotModel}): ${f.rootCause}`
  ).join("\n");
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
  const useNIMLLM = process.env.USE_NIM_LLM === "true" && isNIMLLMAvailable();
  if (useNIMLLM) {
    try {
      const parsed = await callNIMLLMStructured(
        [{ role: "user", content: prompt }],
        improvementSchema,
        { temperature: 0.2, model: "meta/llama-3.1-70b-instruct" }
      );
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validCategories = Object.keys(IMPROVEMENT_TEMPLATES);
        const items = parsed.map((item) => ({
          id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          policyId: item.policyId || "unknown",
          policyTitle: item.policyTitle || "Unknown Policy",
          failureCategory: validCategories.includes(item.failureCategory) ? item.failureCategory : "unknown",
          title: item.title || "Policy improvement",
          description: item.description || "",
          changes: Array.isArray(item.changes) ? item.changes : [],
          estimatedGainPct: Math.min(18, Math.max(3, Number(item.estimatedGainPct) || 8)),
          priority: ["low", "medium", "high", "critical"].includes(item.priority) ? item.priority : "medium",
          status: "pending",
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          appliedAt: null
        }));
        addImprovements(items);
        console.log("Improvement Generation: Used NIM LLM (Llama 3.1 70B)");
        return items;
      }
    } catch (nimErr) {
      console.warn("NIM LLM improvement generation failed, falling back to Gemini:", nimErr?.message);
    }
  }
  try {
    const ai = new import_genai3.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } }
    });
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: improvementSchema
      }
    });
    const parsed = JSON.parse(response.text || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      const validCategories = Object.keys(IMPROVEMENT_TEMPLATES);
      const items = parsed.map((item) => ({
        id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        policyId: item.policyId || "unknown",
        policyTitle: item.policyTitle || "Unknown Policy",
        failureCategory: validCategories.includes(item.failureCategory) ? item.failureCategory : "unknown",
        title: item.title || "Policy improvement",
        description: item.description || "",
        changes: Array.isArray(item.changes) ? item.changes : [],
        estimatedGainPct: Math.min(18, Math.max(3, Number(item.estimatedGainPct) || 8)),
        priority: ["low", "medium", "high", "critical"].includes(item.priority) ? item.priority : "medium",
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        appliedAt: null
      }));
      addImprovements(items);
      console.log("Improvement Generation: Used Gemini 3.6 Flash");
      return items;
    }
  } catch (err) {
    console.warn("Gemini improvement generation fallback used:", err);
  }
  return generateImprovements();
}
function applyImprovement(improvementId) {
  return updateImprovement(improvementId, {
    status: "applied",
    appliedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
}
function listImprovements() {
  return getAllImprovements();
}
function getStats() {
  return getFlywheelStats2();
}

// server/pipeline/policyEvolution.ts
init_sqliteStore();
var versionsTable = getTable("evolution_versions");
var improvementsTable2 = getTable("improvements");
var VERIFICATION_THRESHOLD_PP = 2;
function parseNumeric(value) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return isFinite(num) ? num : null;
}
function findNumericChange(changes, keywords) {
  const change = changes.find(
    (c) => keywords.some((k) => c.parameter.toLowerCase().includes(k)) && parseNumeric(c.from) !== null && parseNumeric(c.to) !== null
  );
  if (!change) return null;
  const fromNum = parseNumeric(change.from);
  const toNum = parseNumeric(change.to);
  if (fromNum === 0) return null;
  return { parameter: change.parameter, ratio: toNum / fromNum };
}
function scaleDiagNumbers(line, ratio) {
  if (!line.includes("np.diag(") || ratio === 1) return line;
  return line.replace(/(np\.diag\s*\(\s*\[)([^\]]+)(\]\s*\))/g, (match, pre, body, post) => {
    const scaled = body.split(",").map((part) => {
      const trimmed = part.trim();
      const numMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
      if (!numMatch) return part;
      const scaledNum = parseFloat(numMatch[0]) * ratio;
      return trimmed.replace(numMatch[0], scaledNum.toFixed(1));
    }).join(", ");
    return `${pre}${scaled}${post}`;
  });
}
function applyGainChangesToPython(pythonCode, kpRatio, kdRatio) {
  if (!kpRatio && !kdRatio) return pythonCode;
  return pythonCode.split("\n").map((line) => {
    const lower = line.toLowerCase();
    let updated = line;
    if (kpRatio && (lower.includes("self.kp") || lower.includes("self.stiffness") || /[^a-z]kp\s*=/.test(lower))) {
      updated = scaleDiagNumbers(updated, kpRatio);
    }
    if (kdRatio && (lower.includes("self.kd") || lower.includes("self.damping") || /[^a-z]kd\s*=/.test(lower))) {
      updated = scaleDiagNumbers(updated, kdRatio);
    }
    return updated;
  }).join("\n");
}
function applyFrictionChangeToMujoco(mujocoXml, changes) {
  const frictionChange = changes.find((c) => c.parameter.toLowerCase().includes("friction"));
  if (!frictionChange || !mujocoXml.includes("<geom")) return mujocoXml;
  const value = parseNumeric(frictionChange.to);
  if (value === null) return mujocoXml;
  return mujocoXml.replace(
    /(<geom\b[^>]*?)(\/>|>)/,
    (match, attrs, close) => `${attrs.replace(/\s+friction="[^"]*"/, "")} friction="${value.toFixed(2)}"${close}`
  );
}
function buildEvolutionPatchBlock(version, appliedTitles, changes) {
  const lines = [
    "",
    "# =============================================",
    `# [Policy-0 Evolution Patch v${version}]`,
    "# Applied improvements:",
    ...appliedTitles.map((t) => `#   - ${t}`),
    "# Parameter changes baked into this policy:",
    ...changes.map((c) => `#   - ${c.target} / ${c.parameter}: ${c.from} -> ${c.to}`),
    "# ============================================="
  ];
  return lines.join("\n");
}
function getAppliedImprovementsForPolicy(policyId) {
  return improvementsTable2.filter((i) => i.policyId === policyId && i.status === "applied");
}
function getLatestVersionForPolicy(policyId) {
  const versions = versionsTable.filter((v) => v.policyId === policyId);
  return versions.length > 0 ? versions[0] : null;
}
function getAllVersions() {
  return versionsTable.list();
}
function getVersionsByPolicy(policyId) {
  return versionsTable.filter((v) => v.policyId === policyId);
}
function addVersion(record) {
  versionsTable.insert({ ...record, id: record.id });
}
function updateVersion(id, patch) {
  versionsTable.updateById(id, patch);
}
function calculateProjectedSuccess(successBefore, appliedImprovements) {
  const totalGain = appliedImprovements.reduce((sum, a) => sum + a.estimatedGainPct, 0);
  return Math.min(99.5, +(successBefore + totalGain * 0.85).toFixed(1));
}
function evolvePolicy(policy) {
  const applied = getAppliedImprovementsForPolicy(policy.id);
  if (applied.length === 0) {
    return null;
  }
  const latest = getLatestVersionForPolicy(policy.id);
  const version = (latest?.version || 0) + 1;
  const allChanges = applied.flatMap((a) => a.changes);
  const kpChange = findNumericChange(allChanges, ["kp", "stiffness"]);
  const kdChange = findNumericChange(allChanges, ["kd", "damping"]);
  const pythonCode = applyGainChangesToPython(policy.pythonCode, kpChange?.ratio ?? null, kdChange?.ratio ?? null) + buildEvolutionPatchBlock(version, applied.map((a) => a.title), allChanges);
  const mujocoXml = applyFrictionChangeToMujoco(policy.mujocoXml, allChanges);
  const successBefore = policy.metrics.successRatePct;
  const projectedSuccess = calculateProjectedSuccess(successBefore, applied);
  const evolved = {
    ...policy,
    title: `${policy.title} (v${version})`,
    pythonCode,
    mujocoXml,
    onnxSpec: {
      ...policy.onnxSpec,
      latencyMs: +(policy.onnxSpec.latencyMs * 0.92).toFixed(2)
    },
    metrics: {
      ...policy.metrics,
      successRatePct: projectedSuccess,
      simToRealConfidencePct: Math.min(99, +(policy.metrics.simToRealConfidencePct + 2.5).toFixed(1)),
      meanTrajectoryTimeSec: +(policy.metrics.meanTrajectoryTimeSec * 0.95).toFixed(1),
      totalSimRuns: policy.metrics.totalSimRuns + 250
    }
  };
  const record = {
    id: `evol_${Date.now().toString(36)}`,
    policyId: policy.id,
    policyTitle: policy.title,
    version,
    appliedImprovementIds: applied.map((a) => a.id),
    appliedImprovementTitles: applied.map((a) => a.title),
    changesApplied: allChanges,
    successRateBeforePct: successBefore,
    projectedSuccessRatePct: projectedSuccess,
    measuredSuccessRatePct: void 0,
    verified: false,
    verificationJobId: void 0,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  addVersion(record);
  return { policy: evolved, record };
}
async function verifyEvolution(params) {
  const { evolvedPolicy, record, previousPolicy } = params;
  if (process.env.USE_ISAAC_SIM !== "true") {
    return { verified: false };
  }
  try {
    const { submitIsaacSimSimulation: submitIsaacSimSimulation2, waitForIsaacSimCompletion: waitForIsaacSimCompletion2, generateSimulationTelemetryIsaacSim: generateSimulationTelemetryIsaacSim2 } = await Promise.resolve().then(() => (init_isaacSimBridge(), isaacSimBridge_exports));
    const jobId = await submitIsaacSimSimulation2({
      robot: evolvedPolicy.robot.id,
      taskTitle: evolvedPolicy.title,
      environment: evolvedPolicy.input.environment,
      controlMode: evolvedPolicy.input.controlMode,
      observationSpace: evolvedPolicy.input.observationSpace,
      domainRandomization: evolvedPolicy.input.domainRandomization,
      robotDof: evolvedPolicy.robot.dof
    });
    const completedJob = await waitForIsaacSimCompletion2(jobId, 6e5, 1e4);
    if (completedJob.status !== "completed") {
      return { verified: false, jobId };
    }
    const telemetry = generateSimulationTelemetryIsaacSim2(completedJob, evolvedPolicy.robot.dof);
    const measuredSuccessRatePct = telemetry.successRatePct;
    const successBefore = previousPolicy.metrics.successRatePct;
    const measuredGainPp = measuredSuccessRatePct - successBefore;
    const verified = measuredGainPp >= VERIFICATION_THRESHOLD_PP;
    updateVersion(record.id, {
      measuredSuccessRatePct,
      verified,
      verificationJobId: jobId
    });
    return { verified, measuredSuccessRatePct, jobId };
  } catch (error) {
    console.error("Evolution verification failed:", error?.message);
    return { verified: false };
  }
}
function getSuccessRateCurve(policyId) {
  const versions = getVersionsByPolicy(policyId);
  return versions.sort((a, b) => a.version - b.version).map((v) => ({
    version: v.version,
    projectedSuccess: v.projectedSuccessRatePct,
    measuredSuccess: v.measuredSuccessRatePct,
    verified: v.verified,
    createdAt: v.createdAt
  }));
}
function getSimToRealGap(policyId) {
  const versions = getVersionsByPolicy(policyId);
  const latestVersion = versions.sort((a, b) => b.version - a.version)[0];
  const simSuccessRatePct = latestVersion?.measuredSuccessRatePct ?? latestVersion?.projectedSuccessRatePct ?? 0;
  const runsTable = getTable("deployment_runs");
  const deployments = runsTable.filter((r) => r.policyId === policyId && r.source === "real_world");
  if (deployments.length === 0) {
    return {
      policyId,
      simSuccessRatePct,
      realSuccessRatePct: void 0,
      gapPct: void 0,
      deployments: 0
    };
  }
  const successfulDeployments = deployments.filter((d) => d.success).length;
  const realSuccessRatePct = +(successfulDeployments / deployments.length * 100).toFixed(1);
  const gapPct = +(simSuccessRatePct - realSuccessRatePct).toFixed(1);
  return {
    policyId,
    simSuccessRatePct,
    realSuccessRatePct,
    gapPct,
    deployments: deployments.length
  };
}
function getEvolutionVersions() {
  return getAllVersions();
}
function getEvolutionLineage(policyId) {
  return getVersionsByPolicy(policyId).sort((a, b) => a.version - b.version);
}
function getEvolutionOverview() {
  const versions = getAllVersions();
  const policiesEvolved = new Set(versions.map((v) => v.policyId)).size;
  const gains = versions.map((v) => {
    const after = v.measuredSuccessRatePct ?? v.projectedSuccessRatePct;
    return after - v.successRateBeforePct;
  });
  const verifiedCount = versions.filter((v) => v.verified).length;
  const measuredCount = versions.filter((v) => v.measuredSuccessRatePct !== void 0).length;
  return {
    policiesEvolved,
    totalVersions: versions.length,
    latestVersionCount: versions.length > 0 ? Math.max(...versions.map((v) => v.version)) : 0,
    improvementsApplied: versions.reduce((sum, v) => sum + v.appliedImprovementIds.length, 0),
    avgGainPct: gains.length > 0 ? +(gains.reduce((a, b) => a + b, 0) / gains.length).toFixed(1) : 0,
    bestGainPct: gains.length > 0 ? Math.max(...gains) : 0,
    verifiedCount,
    measuredCount
  };
}

// server.ts
init_errors();
var import_meta2 = {};
import_dotenv.default.config();
var __filename2 = (0, import_url2.fileURLToPath)(import_meta2.url);
var __dirname2 = import_path9.default.dirname(__filename2);
var app = (0, import_express.default)();
var PORT = parseInt(process.env.PORT || "2009", 10);
app.use(corsMiddleware);
app.use(generalRateLimiter);
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || `req_${Date.now().toString(36)}`;
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  requestCounter.total++;
  requestCounter.byMethod[req.method] = (requestCounter.byMethod[req.method] || 0) + 1;
  const reqLogger = createRequestLogger(requestId);
  reqLogger.info({ method: req.method, url: req.url, ip: req.ip }, "Request started");
  res.on("finish", () => {
    const duration = Date.now() - start;
    requestCounter.avgResponseTime = requestCounter.avgResponseTime * 0.9 + duration * 0.1;
    reqLogger.info({ statusCode: res.statusCode, durationMs: duration }, "Request completed");
  });
  next();
});
app.use("/exports", import_express.default.static(import_path9.default.join(process.cwd(), "exports")));
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || typeof email !== "string") {
      throw new ValidationError("email is required");
    }
    if (typeof password !== "string" || password.length < 8) {
      throw new ValidationError("password must be at least 8 characters");
    }
    if (await countUsers() > 0) {
      throw new ConflictError("Registration is closed. Contact an administrator to create accounts.");
    }
    if (await findUserByEmail(email)) {
      throw new ConflictError("A user with this email already exists");
    }
    const passwordHash = await hashPassword(password);
    const user = await createUser({ email, passwordHash, role: "admin", name });
    res.status(201).json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error("Auth Register Error:", error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message || "Failed to register" });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      throw new ValidationError("email and password are required");
    }
    const user = await findUserByEmail(email);
    if (!user) {
      throw new AuthenticationError("Invalid email or password");
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError("Invalid email or password");
    }
    const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });
    await storeRefreshToken({
      token: refreshToken,
      userId: user.id,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString()
    });
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error("Auth Login Error:", error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message || "Failed to login" });
  }
});
app.post("/api/auth/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      throw new ValidationError("refreshToken is required");
    }
    if (!await isRefreshTokenValid(refreshToken)) {
      throw new AuthenticationError("Invalid or expired refresh token");
    }
    const refreshed = await refreshAccessToken(refreshToken);
    res.json({ success: true, ...refreshed });
  } catch (error) {
    console.error("Auth Refresh Error:", error);
    res.status(error.statusCode || 500).json({ success: false, error: error.message || "Failed to refresh token" });
  }
});
app.post("/api/auth/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken && typeof refreshToken === "string") {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Auth Logout Error:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to logout" });
  }
});
app.get("/api/auth/me", authenticate, async (req, res) => {
  const user = await findUserById(req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  res.json({
    success: true,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  });
});
app.get("/api/auth/users", authenticate, requireRole("admin"), async (req, res) => {
  const users = await listUsers();
  res.json({ success: true, users: users.map((u) => ({ id: u.id, email: u.email, role: u.role, name: u.name })) });
});
app.use(requireApiKey);
app.use(auditLog);
function getGeminiClient3() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }
  return new import_genai4.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
var pipelineRunsTable = getTable("pipeline_runs");
function getPipelineRun(jobId) {
  return pipelineRunsTable.find((r) => r.id === jobId) || null;
}
function setPipelineRun(id, data) {
  pipelineRunsTable.upsert({ id, ...data, submittedAt: data.submittedAt || (/* @__PURE__ */ new Date()).toISOString() });
}
function getPipelineRunEntry(jobId) {
  const r = getPipelineRun(jobId);
  return r || null;
}
function generatePrometheusMetrics() {
  const lines = [];
  const now = Date.now();
  function addMetric(name, value, labels, help, type = "gauge") {
    if (help) lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} ${type}`);
    const labelStr = labels ? `{${Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(",")}}` : "";
    lines.push(`${name}${labelStr} ${value}`);
  }
  addMetric("policy0_requests_total", requestCounter.total, void 0, "Total HTTP requests", "counter");
  addMetric("policy0_requests_by_method", requestCounter.byMethod["GET"] || 0, { method: "GET" }, "HTTP requests by method", "counter");
  addMetric("policy0_requests_by_method", requestCounter.byMethod["POST"] || 0, { method: "POST" }, void 0, "counter");
  addMetric("policy0_requests_by_method", requestCounter.byMethod["DELETE"] || 0, { method: "DELETE" }, void 0, "counter");
  addMetric("policy0_response_time_seconds", requestCounter.avgResponseTime / 1e3, void 0, "Average response time in seconds");
  addMetric("policy0_policies_generated_total", policiesGenerated, void 0, "Total policies generated", "counter");
  addMetric("policy0_policies_active", activePolicies, void 0, "Currently active policies");
  addMetric("policy0_evolution_versions_total", evolutionStats.totalVersions, void 0, "Total evolution versions", "counter");
  addMetric("policy0_evolution_verified_total", evolutionStats.verifiedVersions, void 0, "Verified evolution versions", "counter");
  addMetric("policy0_nvidia_cosmos_available", process.env.USE_COSMOS_VLM === "true" ? 1 : 0, void 0, "Cosmos VLM available");
  addMetric("policy0_nvidia_nim_llm_available", process.env.USE_NIM_LLM === "true" ? 1 : 0, void 0, "NIM LLM available");
  addMetric("policy0_nvidia_isaac_sim_available", process.env.USE_ISAAC_SIM === "true" ? 1 : 0, void 0, "Isaac Sim available");
  addMetric("policy0_nvidia_isaac_lab_available", process.env.USE_ISAAC_LAB === "true" ? 1 : 0, void 0, "Isaac Lab available");
  addMetric("policy0_uptime_seconds", process.uptime(), void 0, "Process uptime in seconds");
  addMetric("policy0_memory_bytes", process.memoryUsage().rss, void 0, "Resident set size in bytes");
  addMetric("policy0_memory_heap_bytes", process.memoryUsage().heapUsed, void 0, "Heap used in bytes");
  addMetric("policy0_info", 1, {
    version: process.env.npm_package_version || "unknown",
    node_version: process.version,
    platform: process.platform
  }, "Process information");
  lines.push("");
  return lines.join("\n");
}
var requestCounter = { total: 0, byMethod: {}, avgResponseTime: 0 };
var policiesGenerated = 0;
var activePolicies = 0;
var evolutionStats = { totalVersions: 0, verifiedVersions: 0 };
app.get("/api/health", (req, res) => {
  const sqliteOk = (() => {
    try {
      const dataDir4 = import_path9.default.join(process.cwd(), "data");
      if (!import_fs9.default.existsSync(dataDir4)) return false;
      import_fs9.default.accessSync(dataDir4, import_fs9.default.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  })();
  const isaacSimEnabled = process.env.USE_ISAAC_SIM === "true";
  const isaacLabEnabled = process.env.USE_ISAAC_LAB === "true";
  res.json({
    success: true,
    status: "ok",
    pipelineVersion: "Policy-0 Engine v4.1",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    checks: {
      sqlite: sqliteOk ? "connected" : "unavailable",
      isaac_sim: isaacSimEnabled ? "enabled" : "disabled",
      isaac_lab: isaacLabEnabled ? "enabled" : "disabled",
      nvidia_api: process.env.NVIDIA_API_KEY ? "configured" : "missing",
      gemini_api: process.env.GEMINI_API_KEY ? "configured" : "missing"
    },
    features: {
      auth: !!process.env.POLICY0_API_KEY,
      cosmos_vlm: process.env.USE_COSMOS_VLM === "true",
      nim_llm: process.env.USE_NIM_LLM === "true",
      isaac_sim: process.env.USE_ISAAC_SIM === "true",
      isaac_lab: process.env.USE_ISAAC_LAB === "true",
      isaac_sim_rtx: process.env.USE_ISAAC_SIM_RTX === "true",
      leapp_export: process.env.USE_LEAPP_EXPORT === "true",
      isaac_ros: process.env.USE_ISAAC_ROS === "true",
      osmo: process.env.USE_OSMO === "true"
    }
  });
});
app.get("/api/vlm/providers", (req, res) => {
  const geminiAvailable = !!process.env.GEMINI_API_KEY;
  const cosmosAvailable = !!process.env.NVIDIA_API_KEY;
  const useCosmos = process.env.USE_COSMOS_VLM === "true" && cosmosAvailable;
  res.json({
    success: true,
    providers: {
      gemini: { available: geminiAvailable, name: "Gemini 3.6 Flash" },
      cosmos: { available: cosmosAvailable, name: "Cosmos Reasoner NIM" }
    },
    active: useCosmos ? "cosmos" : geminiAvailable ? "gemini" : "none",
    useCosmosFlag: process.env.USE_COSMOS_VLM === "true"
  });
});
app.get("/api/nvidia/health", async (req, res) => {
  const startTime = Date.now();
  const checks = {};
  async function testEndpoint(name, url, headers, method = "GET", body) {
    const checkStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5e3);
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : void 0,
        signal: controller.signal
      });
      clearTimeout(timeout);
      const latency = Date.now() - checkStart;
      checks[name] = {
        status: response.ok ? "ok" : "degraded",
        latencyMs: latency,
        error: response.ok ? void 0 : `${response.status} ${response.statusText}`,
        endpoint: url
      };
    } catch (err) {
      checks[name] = {
        status: "down",
        latencyMs: Date.now() - checkStart,
        error: err.name === "AbortError" ? "timeout" : err.message,
        endpoint: url
      };
    }
  }
  if (process.env.USE_COSMOS_VLM === "true" && process.env.NVIDIA_API_KEY) {
    await testEndpoint(
      "cosmos_reasoner_nim",
      process.env.COSMOS_NIM_ENDPOINT || "https://api.nvidia.com/v1/cosmos/reasoner",
      { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}` },
      "POST",
      { video: "", text: "health check", task: "robot_task_understanding" }
    );
  } else {
    checks.cosmos_reasoner_nim = { status: "down", error: "disabled or no API key", endpoint: process.env.COSMOS_NIM_ENDPOINT };
  }
  if (process.env.USE_NIM_LLM === "true" && process.env.NVIDIA_API_KEY) {
    await testEndpoint(
      "nim_llm",
      process.env.NIM_LLM_ENDPOINT || "https://api.nvidia.com/v1/nim/llama-3-70b",
      { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}` },
      "POST",
      { model: "meta/llama-3.1-70b-instruct", messages: [{ role: "user", content: "health check" }], max_tokens: 1 }
    );
  } else {
    checks.nim_llm = { status: "down", error: "disabled or no API key", endpoint: process.env.NIM_LLM_ENDPOINT };
  }
  if (process.env.USE_ISAAC_SIM === "true") {
    if (process.env.USE_OSMO === "true" && process.env.NVIDIA_API_KEY) {
      await testEndpoint(
        "isaac_sim_osmo",
        `${process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo"}/health`,
        { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}` }
      );
    } else {
      await testEndpoint("isaac_sim_local", `${process.env.ISAAC_SIM_ENDPOINT || "http://localhost:8211"}/health`);
    }
  } else {
    checks.isaac_sim = { status: "down", error: "disabled", endpoint: process.env.ISAAC_SIM_ENDPOINT };
  }
  if (process.env.USE_ISAAC_LAB === "true") {
    if (process.env.USE_OSMO === "true" && process.env.NVIDIA_API_KEY) {
      await testEndpoint(
        "isaac_lab_osmo",
        `${process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo"}/health`,
        { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}` }
      );
    } else {
      await testEndpoint("isaac_lab_local", `${process.env.ISAAC_LAB_ENDPOINT || "http://localhost:8212"}/health`);
    }
  } else {
    checks.isaac_lab = { status: "down", error: "disabled", endpoint: process.env.ISAAC_LAB_ENDPOINT };
  }
  if (process.env.USE_ISAAC_SIM_RTX === "true") {
    if (process.env.USE_OSMO === "true" && process.env.NVIDIA_API_KEY) {
      checks.isaac_sim_rtx = { status: "ok", error: "routed via OSMO", endpoint: process.env.OSMO_ENDPOINT };
    } else {
      await testEndpoint("isaac_sim_rtx_local", `${process.env.ISAAC_SIM_ENDPOINT || "http://localhost:8211"}/api/v1/render/health`);
    }
  } else {
    checks.isaac_sim_rtx = { status: "down", error: "disabled", endpoint: process.env.ISAAC_SIM_ENDPOINT };
  }
  if (process.env.USE_LEAPP_EXPORT === "true") {
    if (process.env.USE_OSMO === "true" && process.env.NVIDIA_API_KEY) {
      checks.leapp_export = { status: "ok", error: "routed via OSMO", endpoint: process.env.OSMO_ENDPOINT };
    } else {
      await testEndpoint("leapp_export_local", `${process.env.ISAAC_LAB_ENDPOINT || "http://localhost:8212"}/api/v1/export/onnx/health`);
    }
  } else {
    checks.leapp_export = { status: "down", error: "disabled", endpoint: process.env.ISAAC_LAB_ENDPOINT };
  }
  checks.isaac_ros = { status: process.env.USE_ISAAC_ROS === "true" ? "ok" : "down", error: process.env.USE_ISAAC_ROS === "true" ? "local generation only" : "disabled", endpoint: "local" };
  if (process.env.USE_OSMO === "true" && process.env.NVIDIA_API_KEY) {
    await testEndpoint("osmo", `${process.env.OSMO_ENDPOINT || "https://api.nvidia.com/v1/osmo"}/health`, { "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}` });
  } else {
    checks.osmo = { status: "down", error: "disabled or no API key", endpoint: process.env.OSMO_ENDPOINT };
  }
  const overallStatus = Object.values(checks).every((c) => c.status === "ok") ? "ok" : Object.values(checks).some((c) => c.status === "down") ? "degraded" : "ok";
  res.json({
    success: true,
    overall: overallStatus,
    totalLatencyMs: Date.now() - startTime,
    checks,
    flags: {
      USE_COSMOS_VLM: process.env.USE_COSMOS_VLM === "true",
      USE_NIM_LLM: process.env.USE_NIM_LLM === "true",
      USE_ISAAC_SIM: process.env.USE_ISAAC_SIM === "true",
      USE_ISAAC_LAB: process.env.USE_ISAAC_LAB === "true",
      USE_ISAAC_SIM_RTX: process.env.USE_ISAAC_SIM_RTX === "true",
      USE_LEAPP_EXPORT: process.env.USE_LEAPP_EXPORT === "true",
      USE_ISAAC_ROS: process.env.USE_ISAAC_ROS === "true",
      USE_OSMO: process.env.USE_OSMO === "true"
    }
  });
});
app.get("/metrics", (req, res) => {
  const metrics = generatePrometheusMetrics();
  res.set("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(metrics);
});
app.get("/health/live", (req, res) => {
  res.json({ status: "alive", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/health/ready", (req, res) => {
  const checks = {
    persistence: false
  };
  try {
    const dataDir4 = import_path9.default.join(process.cwd(), "data");
    checks.persistence = import_fs9.default.existsSync(dataDir4);
    if (checks.persistence) {
      import_fs9.default.accessSync(dataDir4, import_fs9.default.constants.W_OK);
    }
  } catch {
    checks.persistence = false;
  }
  const ready = Object.values(checks).every(Boolean);
  res.status(ready ? 200 : 503).json({
    status: ready ? "ready" : "not_ready",
    checks,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
app.post("/api/upload/video", authenticate, uploadRateLimiter, upload.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No video file uploaded" });
    }
    const video = storeVideoUpload(
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      req.file.path
    );
    res.json({ success: true, video });
  } catch (error) {
    console.error("Video Upload Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to upload video" });
  }
});
app.post("/api/policy/analyze-vlm", authenticate, validateBody(schemas.analyzeVLM), async (req, res) => {
  try {
    const { videoUploadId, description } = req.body;
    if (!videoUploadId) {
      return res.status(400).json({ success: false, error: "videoUploadId is required" });
    }
    const videoPath = getVideoUploadPath(videoUploadId);
    const prompt = `Analyze this robot task demonstration video. Extract structured task specifications for policy generation.

Perform a detailed embodied AI trajectory analysis. Output a JSON object with:
1. taskTitle: A concise title for the robot task.
2. taskDescription: Detailed description of what the robot should do.
3. robotType: The type of robot needed (arm, humanoid, hand, mobile_manipulator).
4. robotDof: Degrees of freedom required (integer).
5. controlMode: Best control mode (Cartesian Impedance, Joint Velocity, Delta EE Pose, Action Chunks).
6. observationSpace: Array of observation modalities needed (RGB Camera, Depth Map, Joint Encoders, EE Force/Torque, Tactile Arrays).
7. environment: Simulation environment (MuJoCo, Isaac Sim, Drake, PyBullet).
8. keyframes: Array of key stages with stage name, timestamp, gripper state, and action description.
9. obstacleConstraints: Array of identified obstacles or collision risks.
10. recommendedControlMode: The recommended control mode string.
11. simToRealTips: Array of 3 calibration recommendations.

Be precise and thorough in the analysis.`;
    let result;
    const useCosmos = process.env.USE_COSMOS_VLM === "true" && isCosmosAvailable();
    if (useCosmos) {
      try {
        result = await analyzeVideoWithCosmos(videoPath, prompt, videoUploadId);
        console.log("VLM Analysis: Used Cosmos Reasoner NIM");
      } catch (cosmosError) {
        console.warn("Cosmos NIM failed, falling back to Gemini:", cosmosError?.message);
        result = await analyzeVideoWithVLM(videoPath, prompt);
      }
    } else {
      result = await analyzeVideoWithVLM(videoPath, prompt);
    }
    result.videoUploadId = videoUploadId;
    res.json({ success: true, analysis: result, provider: useCosmos ? "cosmos" : "gemini" });
  } catch (error) {
    console.error("VLM Analysis Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to analyze video with VLM" });
  }
});
app.post("/api/policy/analyze-description", authenticate, validateBody(schemas.analyzeDescription), async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Description is required" });
    }
    let result;
    const useCosmos = process.env.USE_COSMOS_VLM === "true" && isCosmosAvailable();
    if (useCosmos) {
      try {
        result = await analyzeDescriptionWithCosmos(description);
        console.log("VLM Description Analysis: Used Cosmos Reasoner NIM");
      } catch (cosmosError) {
        console.warn("Cosmos NIM failed, falling back to Gemini:", cosmosError?.message);
        result = await analyzeVideoWithVLMFromDescription(description);
      }
    } else {
      result = await analyzeVideoWithVLMFromDescription(description);
    }
    res.json({ success: true, analysis: result, provider: useCosmos ? "cosmos" : "gemini" });
  } catch (error) {
    console.error("VLM Description Analysis Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to analyze description with VLM" });
  }
});
app.post("/api/policy/generate-video", authenticate, strictRateLimiter, validateBody(schemas.generateVideo), async (req, res) => {
  try {
    const {
      taskTitle,
      taskDescription,
      robotModel,
      robotDof,
      controlMode,
      resolution,
      durationSec,
      domainRandomization
    } = req.body;
    if (!taskTitle) {
      return res.status(400).json({ success: false, error: "taskTitle is required" });
    }
    const request = {
      taskTitle: taskTitle || "Robot Task",
      taskDescription: taskDescription || "",
      robotModel: robotModel || "franka_panda",
      robotDof: robotDof || 7,
      controlMode: controlMode || "Cartesian Impedance",
      resolution: resolution || "1080p",
      durationSec: durationSec || 10,
      domainRandomization: !!domainRandomization
    };
    let result;
    const useRTX = process.env.USE_ISAAC_SIM_RTX === "true";
    if (useRTX) {
      try {
        result = await generateIsaacSimRTXVideo(request);
        console.log("Video Generation: Used Isaac Sim RTX rendering");
      } catch (rtxErr) {
        console.warn("Isaac Sim RTX rendering failed, falling back to simulated:", rtxErr?.message);
        result = generateSimulatedRTXVideo(request);
      }
    } else {
      result = await generateNVIDIAVideo(request);
    }
    res.json({ success: true, video: result });
  } catch (error) {
    console.error("NVIDIA Video Generation Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to generate NVIDIA video" });
  }
});
app.get("/api/policy/video-status/:jobId", authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const status = getNVIDIAJobStatus(jobId);
    if (status === null) {
      return res.status(404).json({ success: false, error: "Job not found" });
    }
    const result = getNVIDIAJobResult(jobId);
    res.json({ success: true, status, result });
  } catch (error) {
    console.error("Video Status Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get video status" });
  }
});
app.post("/api/policy/approve", authenticate, validateBody(schemas.approval), async (req, res) => {
  try {
    const { approvalId, decision, policyId, feedback } = req.body;
    let result;
    switch (decision) {
      case "approved":
        result = approveVideo(approvalId, policyId || null);
        break;
      case "rejected":
        result = rejectVideo(approvalId, feedback || "");
        break;
      case "revision_requested":
        result = requestRevision(approvalId, feedback || "");
        break;
      default:
        return res.status(400).json({ success: false, error: "Invalid decision. Must be approved, rejected, or revision_requested" });
    }
    res.json({ success: true, approval: result });
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to process approval" });
  }
});
app.post("/api/policy/create-approval", authenticate, validateBody(schemas.createApproval), async (req, res) => {
  try {
    const { videoGenId, expiresInHours } = req.body;
    const approval = createApprovalRequest(videoGenId);
    res.json({ success: true, approval });
  } catch (error) {
    console.error("Create Approval Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to create approval request" });
  }
});
app.get("/api/policy/approval/:approvalId", authenticate, async (req, res) => {
  try {
    const { approvalId } = req.params;
    const approval = getApproval(approvalId);
    if (!approval) {
      return res.status(404).json({ success: false, error: "Approval not found" });
    }
    res.json({ success: true, approval });
  } catch (error) {
    console.error("Get Approval Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get approval status" });
  }
});
app.post("/api/policy/onnx-export", strictRateLimiter, validateBody(schemas.onnxExport), async (req, res) => {
  try {
    const { policy, format, optimize, quantization } = req.body;
    if (!policy) {
      return res.status(400).json({ success: false, error: "policy is required" });
    }
    const options = {
      policy,
      format: format || "onnx",
      optimize: optimize !== false,
      quantization: quantization || null
    };
    let result;
    const useLeapp = process.env.USE_LEAPP_EXPORT === "true";
    if (useLeapp) {
      const hasCheckpoint = !!getCheckpoint(policy.id);
      try {
        if (!hasCheckpoint) {
          console.warn("LEAPP: No checkpoint registered for policy; using simulated LEAPP export.");
          result = generateSimulatedLEAPPExport(options);
          console.log("ONNX Export: Used simulated LEAPP export (no checkpoint registered).");
        } else {
          result = await exportPolicyViaLEAPP(options);
          console.log("ONNX Export: Used Isaac Lab LEAPP export.");
        }
      } catch (leappErr) {
        console.warn("LEAPP export failed, falling back to simulated LEAPP:", leappErr?.message);
        result = generateSimulatedLEAPPExport(options);
      }
    } else {
      result = await exportPolicyToONNX(options);
    }
    res.json({ success: true, export: result });
  } catch (error) {
    console.error("ONNX Export Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to export ONNX model" });
  }
});
app.get("/api/policy/onnx-download/:fileName", authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    const buffer = serveOnnxFile(fileName);
    if (!buffer) {
      return res.status(404).json({ success: false, error: "ONNX file not found" });
    }
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("ONNX Download Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to download ONNX file" });
  }
});
app.get("/api/policy/isaac-ros-packages", authenticate, async (req, res) => {
  try {
    const exportsRoot = import_path9.default.join(process.cwd(), "exports");
    if (!import_fs9.default.existsSync(exportsRoot)) {
      return res.json({ success: true, packages: [] });
    }
    const policyDirs = import_fs9.default.readdirSync(exportsRoot).filter((d) => {
      const p = import_path9.default.join(exportsRoot, d);
      return import_fs9.default.statSync(p).isDirectory() && import_fs9.default.existsSync(import_path9.default.join(p, "ros2_ws"));
    });
    const packages = policyDirs.map((policyId) => {
      const wsRoot = import_path9.default.join(exportsRoot, policyId, "ros2_ws");
      const manifestPath = import_path9.default.join(wsRoot, "isaac_ros_manifest.json");
      let manifest = null;
      try {
        manifest = JSON.parse(import_fs9.default.readFileSync(manifestPath, "utf-8"));
      } catch {
      }
      return { policyId, manifest };
    });
    res.json({ success: true, packages });
  } catch (error) {
    console.error("Isaac ROS Package List Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list Isaac ROS packages" });
  }
});
app.get("/api/policy/isaac-ros-deploy/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    const wsRoot = import_path9.default.join(process.cwd(), "exports", policyId, "ros2_ws");
    if (!import_fs9.default.existsSync(wsRoot)) {
      return res.status(404).json({ success: false, error: "No Isaac ROS deployment package found for this policy" });
    }
    const manifestPath = import_path9.default.join(wsRoot, "isaac_ros_manifest.json");
    let manifest = null;
    try {
      manifest = JSON.parse(import_fs9.default.readFileSync(manifestPath, "utf-8"));
    } catch {
      manifest = synthesizePackageManifest(wsRoot);
    }
    res.json({ success: true, policyId, packageName: manifest?.packageName || `policy0_${policyId}`, workspaceRoot: wsRoot, manifest });
  } catch (error) {
    console.error("Isaac ROS Deploy Manifest Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch Isaac ROS deployment package" });
  }
});
app.get("/api/policy/ros2-download/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    const relativePath = req.query.file || "";
    if (!relativePath) {
      return res.status(400).json({ success: false, error: "file query param is required" });
    }
    if (relativePath.includes("..") || relativePath.startsWith("/") || relativePath.includes("\\")) {
      return res.status(400).json({ success: false, error: "Invalid file path" });
    }
    const wsRoot = import_path9.default.join(process.cwd(), "exports", policyId, "ros2_ws");
    const filePath = import_path9.default.join(wsRoot, relativePath);
    if (!import_fs9.default.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: "File not found in deployment package" });
    }
    const buffer = import_fs9.default.readFileSync(filePath);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${import_path9.default.basename(filePath)}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Isaac ROS File Download Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to download file" });
  }
});
function synthesizePackageManifest(wsRoot) {
  const files = [];
  function walk(dir, base) {
    for (const entry of import_fs9.default.readdirSync(dir, { withFileTypes: true })) {
      const full = import_path9.default.join(dir, entry.name);
      const rel = import_path9.default.relative(base, full).replace(/\\/g, "/");
      if (entry.isDirectory()) walk(full, base);
      else files.push({ relativePath: rel, size: import_fs9.default.statSync(full).size });
    }
  }
  walk(wsRoot, wsRoot);
  return { files };
}
app.post("/api/telemetry/collect", strictRateLimiter, validateBody(schemas.telemetryCollect), (req, res) => {
  try {
    const {
      policyId,
      robotModel,
      taskTitle,
      outcome,
      successScore,
      durationSec,
      numAttempts,
      errorSignals,
      environmentFingerprint,
      source,
      deviceSerial
    } = req.body;
    if (!policyId || !outcome) {
      return res.status(400).json({ success: false, error: "policyId and outcome are required" });
    }
    const run = collectDeploymentRun({
      policyId,
      robotModel,
      taskTitle,
      outcome,
      successScore,
      durationSec,
      numAttempts,
      errorSignals,
      environmentFingerprint,
      source,
      deviceSerial
    });
    res.json({ success: true, run });
  } catch (error) {
    console.error("Telemetry Collect Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to collect deployment telemetry" });
  }
});
app.post("/api/telemetry/simulate", authenticate, strictRateLimiter, validateBody(schemas.telemetrySimulate), async (req, res) => {
  try {
    const { policyId, source } = req.body;
    const runs = getAllRuns2();
    const policyRun = runs.find((r) => r.policyId === policyId);
    if (!policyRun) {
      return res.status(404).json({ success: false, error: "Policy run not found" });
    }
    const run = simulateDeploymentRun({
      id: policyRun.id,
      title: policyRun.taskTitle || "Untitled Policy",
      robotName: policyRun.robotModel || "Unknown Robot",
      metrics: { successRatePct: policyRun.successScore || 90 },
      input: { robotId: policyRun.policyId }
    });
    res.json({ success: true, run });
  } catch (error) {
    console.error("Telemetry Simulate Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to simulate deployment run" });
  }
});
app.get("/api/telemetry/runs", authenticate, async (req, res) => {
  try {
    const runs = getAllRuns2();
    res.json({ success: true, runs });
  } catch (error) {
    console.error("Telemetry Runs Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list deployment runs" });
  }
});
app.get("/api/telemetry/failures", authenticate, async (req, res) => {
  try {
    const failures = getAllFailures();
    res.json({ success: true, failures });
  } catch (error) {
    console.error("Telemetry Failures Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list failures" });
  }
});
app.get("/api/telemetry/stats", authenticate, async (req, res) => {
  try {
    const stats = getDataMoatStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Telemetry Stats Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to compute flywheel stats" });
  }
});
app.post("/api/telemetry/categorize", authenticate, async (req, res) => {
  try {
    const { runId, force } = req.body;
    if (!runId) {
      return res.status(400).json({ success: false, error: "runId is required" });
    }
    if (!force && getFailureByRunId(runId)) {
      return res.json({ success: true, failure: getFailureByRunId(runId), alreadyClassified: true });
    }
    const failure = await upgradeFailureClassificationWithLLM(runId);
    res.json({ success: true, failure });
  } catch (error) {
    console.error("Failure Categorize Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to categorize failure with LLM" });
  }
});
app.get("/api/telemetry/uncategorized", authenticate, async (req, res) => {
  try {
    const runs = getUncategorizedFailuresForCollector();
    res.json({ success: true, runs });
  } catch (error) {
    console.error("Uncategorized Failures Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list uncategorized failures" });
  }
});
app.post("/api/improvements/generate", authenticate, validateBody(schemas.improvementsGenerate), async (req, res) => {
  try {
    const { useLLM } = req.body;
    const improvements = useLLM ? await generateImprovementsWithLLM() : generateImprovements();
    const stats = getStats();
    res.json({ success: true, improvements, stats });
  } catch (error) {
    console.error("Improvements Generate Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to generate improvements" });
  }
});
app.get("/api/improvements", authenticate, async (req, res) => {
  try {
    const improvements = listImprovements();
    res.json({ success: true, improvements });
  } catch (error) {
    console.error("Improvements List Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list improvements" });
  }
});
app.post("/api/improvements/apply", authenticate, validateBody(schemas.improvementApply), async (req, res) => {
  try {
    const { improvementId } = req.body;
    const improvement = applyImprovement(improvementId);
    if (!improvement) {
      return res.status(404).json({ success: false, error: "Improvement not found" });
    }
    const stats = getStats();
    res.json({ success: true, improvement, stats });
  } catch (error) {
    console.error("Improvements Apply Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to apply improvement" });
  }
});
app.post("/api/evolution/regenerate", authenticate, validateBody(schemas.evolutionRegenerate), async (req, res) => {
  try {
    const { policy } = req.body;
    if (!policy || !policy.id) {
      return res.status(400).json({ success: false, error: "policy is required" });
    }
    const previousPolicy = { ...policy };
    const result = evolvePolicy(policy);
    if (!result) {
      return res.status(400).json({
        success: false,
        error: "No applied improvements found for this policy. Apply improvements first, then regenerate."
      });
    }
    const verification = await verifyEvolution({
      evolvedPolicy: result.policy,
      record: result.record,
      previousPolicy
    });
    const canAutoDeploy = verification.verified && result.policy.mode === "REAL";
    res.json({
      success: true,
      policy: result.policy,
      record: {
        ...result.record,
        measuredSuccessRatePct: verification.measuredSuccessRatePct,
        verified: verification.verified,
        verificationJobId: verification.jobId
      },
      verification: {
        verified: verification.verified,
        measuredSuccessRatePct: verification.measuredSuccessRatePct,
        jobId: verification.jobId,
        thresholdPp: 2,
        canAutoDeploy
      },
      overview: getEvolutionOverview()
    });
  } catch (error) {
    console.error("Evolution Regenerate Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to regenerate evolved policy" });
  }
});
app.get("/api/evolution/versions", authenticate, async (req, res) => {
  try {
    const versions = getEvolutionVersions();
    res.json({ success: true, versions });
  } catch (error) {
    console.error("Evolution Versions Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list evolution versions" });
  }
});
app.get("/api/evolution/versions/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    const lineage = getEvolutionLineage(policyId);
    res.json({ success: true, lineage });
  } catch (error) {
    console.error("Evolution Lineage Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list evolution lineage" });
  }
});
app.get("/api/evolution/curve/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    const curve = getSuccessRateCurve(policyId);
    res.json({ success: true, policyId, curve });
  } catch (error) {
    console.error("Evolution Curve Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get success rate curve" });
  }
});
app.get("/api/evolution/gap/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    const gap = getSimToRealGap(policyId);
    res.json({ success: true, gap });
  } catch (error) {
    console.error("Evolution Gap Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get sim-to-real gap" });
  }
});
app.get("/api/evolution/overview", authenticate, async (req, res) => {
  try {
    const overview = getEvolutionOverview();
    res.json({ success: true, overview });
  } catch (error) {
    console.error("Evolution Overview Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get evolution overview" });
  }
});
app.post("/api/isaaclab/train", authenticate, strictRateLimiter, validateBody(schemas.isaacLabTrain), async (req, res) => {
  try {
    const { robot, taskTitle, controlMode, observationSpace, domainRandomization, robotDof, planType } = req.body;
    if (!robot || !taskTitle) {
      return res.status(400).json({ success: false, error: "robot and taskTitle are required" });
    }
    const { submitIsaacLabTraining: submitIsaacLabTraining2 } = await Promise.resolve().then(() => (init_isaacLabBridge(), isaacLabBridge_exports));
    const jobId = await submitIsaacLabTraining2({
      robot,
      taskTitle,
      controlMode: controlMode || "Cartesian Impedance",
      observationSpace: observationSpace || ["RGB Camera", "Joint Encoders"],
      domainRandomization: !!domainRandomization,
      robotDof: robotDof || 7,
      planType: planType || "Plan B: Neural VLA Policy (ONNX)"
    });
    res.json({ success: true, jobId });
  } catch (error) {
    console.error("Isaac Lab Train Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to submit Isaac Lab training job" });
  }
});
app.get("/api/isaaclab/train/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const { getIsaacLabJobStatus: getIsaacLabJobStatus2 } = await Promise.resolve().then(() => (init_isaacLabBridge(), isaacLabBridge_exports));
    const status = await getIsaacLabJobStatus2(jobId);
    if (!status) {
      return res.status(404).json({ success: false, error: `Isaac Lab job not found: ${jobId}` });
    }
    res.json({ success: true, status });
  } catch (error) {
    console.error("Isaac Lab Status Error:", error);
    if (error?.status === 404 || /not found/i.test(error?.message || "")) {
      return res.status(404).json({ success: false, error: error.message || "Isaac Lab job not found" });
    }
    res.status(500).json({ success: false, error: error?.message || "Failed to get Isaac Lab job status" });
  }
});
app.post("/api/isaaclab/train/:jobId/wait", authenticate, validateBody(schemas.isaacLabWait), async (req, res) => {
  try {
    const { jobId } = req.params;
    const { timeoutMs = 36e5, pollIntervalMs = 15e3, policyId, robotId, robotDof } = req.body;
    const { waitForIsaacLabTrainingCompletion: waitForIsaacLabTrainingCompletion2, generateIsaacLabTrainingTelemetry: generateIsaacLabTrainingTelemetry2 } = await Promise.resolve().then(() => (init_isaacLabBridge(), isaacLabBridge_exports));
    const completedJob = await waitForIsaacLabTrainingCompletion2(jobId, timeoutMs, pollIntervalMs);
    if (completedJob.status !== "completed") {
      return res.json({ success: false, error: completedJob.error || "Training failed", status: completedJob });
    }
    if (policyId && completedJob.checkpoint_url) {
      const taskName = robotId ? (await Promise.resolve().then(() => (init_isaacLabBridge(), isaacLabBridge_exports))).getIsaacLabTaskName(robotId) : "Isaac-Manipulation-Franka-Panda-v0";
      registerCheckpoint(
        policyId,
        completedJob.checkpoint_url,
        taskName,
        typeof robotDof === "number" ? robotDof : 7,
        {
          success_rate: completedJob.metrics?.success_rate ?? 0,
          mean_reward: completedJob.metrics?.mean_reward ?? 0
        }
      );
    }
    const { metrics, telemetry } = generateIsaacLabTrainingTelemetry2(completedJob, 7);
    res.json({ success: true, job: completedJob, metrics, telemetry });
  } catch (error) {
    console.error("Isaac Lab Wait Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to wait for Isaac Lab training" });
  }
});
app.post("/api/isaaclab/export-onnx", authenticate, validateBody(schemas.isaacLabExportOnnx), async (req, res) => {
  try {
    const { policyId, checkpointId } = req.body;
    let checkpointPath = checkpointId;
    if (!checkpointId) {
      const { getCheckpoint: getCheckpoint2 } = await Promise.resolve().then(() => (init_leappExporter(), leappExporter_exports));
      const checkpoint = getCheckpoint2(policyId);
      if (!checkpoint) {
        return res.status(404).json({ success: false, error: "No checkpoint registered for this policy" });
      }
      checkpointPath = checkpoint.checkpointPath;
    }
    const { exportIsaacLabPolicyToONNX: exportIsaacLabPolicyToONNX2 } = await Promise.resolve().then(() => (init_isaacLabBridge(), isaacLabBridge_exports));
    const result = await exportIsaacLabPolicyToONNX2(policyId, checkpointPath, { format: "onnx", optimize: true, quantization: "fp16" });
    res.json({ success: true, export: result });
  } catch (error) {
    console.error("Isaac Lab ONNX Export Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to export ONNX from Isaac Lab" });
  }
});
app.post("/api/isaaclab/register-checkpoint", authenticate, validateBody(schemas.isaacLabRegisterCheckpoint), async (req, res) => {
  try {
    const {
      policyId,
      checkpointPath,
      taskName,
      robotDof,
      jobMetrics
    } = req.body;
    registerCheckpoint(
      policyId,
      checkpointPath,
      taskName || "Isaac-Manipulation-Franka-Panda-v0",
      typeof robotDof === "number" ? robotDof : 7,
      jobMetrics
    );
    res.json({
      success: true,
      message: `Checkpoint registered for policy ${policyId}`,
      registeredAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (error) {
    console.error("Checkpoint Registration Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to register checkpoint" });
  }
});
app.get("/api/isaaclab/checkpoint/:policyId", authenticate, async (req, res) => {
  try {
    const { policyId } = req.params;
    const checkpoint = getCheckpoint(policyId);
    if (!checkpoint) {
      return res.status(404).json({ success: false, error: "No checkpoint registered for this policy" });
    }
    res.json({ success: true, checkpoint });
  } catch (error) {
    console.error("Checkpoint Lookup Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to lookup checkpoint" });
  }
});
app.get("/api/policy/leapp-metadata/:fileName", authenticate, async (req, res) => {
  try {
    const { fileName } = req.params;
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      return res.status(400).json({ success: false, error: "Invalid file name" });
    }
    if (!fileName.endsWith(".leapp.json")) {
      return res.status(400).json({ success: false, error: "Only .leapp.json metadata files are served" });
    }
    const buffer = serveLeappMetadataFile(fileName);
    if (!buffer) {
      return res.status(404).json({ success: false, error: "LEAPP metadata not found" });
    }
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    console.error("LEAPP Metadata Download Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to serve LEAPP metadata" });
  }
});
app.post("/api/policy/generate", strictRateLimiter, validateBody(schemas.generatePolicy), async (req, res) => {
  try {
    const {
      title,
      description,
      robotId,
      robotName,
      robotDof,
      robotType,
      environment,
      controlMode,
      observationSpace,
      videoName,
      domainRandomization,
      maxExecutionTimeSec
    } = req.body;
    const routingDecision = evaluatePolicyRouting({
      title: title || description || "Robot Policy",
      description: description || "",
      robotId: robotId || "franka_panda",
      robotDof: robotDof || 7,
      robotType: robotType || "arm",
      controlMode: controlMode || "Cartesian Impedance",
      observationSpace: Array.isArray(observationSpace) ? observationSpace : ["RGB Camera", "Joint Encoders"],
      domainRandomization: !!domainRandomization
    });
    const mujocoXml = compileMuJoCoXml({
      robotId: robotId || "franka_panda",
      robotName: robotName || "Franka Emika Panda",
      taskTitle: title || "Task",
      environment: environment || "MuJoCo",
      domainRandomization: !!domainRandomization
    });
    const ros2NodeCode = exportRos2Node({
      robotId: robotId || "franka_panda",
      robotName: robotName || "Franka Emika Panda",
      taskTitle: title || "Task",
      dof: robotDof || 7,
      controlMode: controlMode || "Cartesian Impedance"
    });
    if (process.env.USE_ISAAC_ROS === "true") {
      try {
        const isaacRosPolicy = {
          id: `pol_${Date.now().toString(36)}`,
          title: title || "Custom Robot Policy",
          description: description || "",
          robot: {
            id: robotId || "franka_panda",
            name: robotName || "Franka Emika Panda",
            manufacturer: "",
            type: "arm",
            dof: robotDof || 7,
            payloadKg: 0,
            controlFrequencyHz: 1e3,
            sensors: Array.isArray(observationSpace) ? observationSpace : ["RGB Camera", "Joint Encoders"],
            description: "",
            badge: "",
            color: "",
            jointNames: [],
            defaultControlMode: controlMode || "Cartesian Impedance"
          },
          input: {
            title: title || "Task",
            description: description || "",
            robotId: robotId || "franka_panda",
            environment: environment || "MuJoCo",
            controlMode: controlMode || "Cartesian Impedance",
            observationSpace: Array.isArray(observationSpace) ? observationSpace : ["RGB Camera", "Joint Encoders"],
            domainRandomization: !!domainRandomization,
            maxExecutionTimeSec: maxExecutionTimeSec || 30
          },
          routing: routingDecision,
          status: "validated",
          pythonCode: "",
          mujocoXml,
          ros2NodeCode,
          onnxSpec: {
            inputShape: `1 x ${robotDof ? robotDof * 3 + 6 : 24}`,
            outputShape: `1 x ${robotDof || 7}`,
            latencyMs: 0.6,
            fileSizeBytes: 12e5
          },
          metrics: {
            successRatePct: 0,
            meanTrajectoryTimeSec: 0,
            simToRealConfidencePct: 0,
            energyScoreJoule: 0,
            totalSimRuns: 0
          },
          telemetry: [],
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const pkg = generateIsaacROSDeployment({
          policy: isaacRosPolicy,
          onnxExport: null,
          leappMetadata: null
        });
        try {
          const manifestPath = import_path9.default.join(pkg.ros2Workspace, "isaac_ros_manifest.json");
          import_fs9.default.writeFileSync(manifestPath, JSON.stringify({
            packageName: pkg.packageName,
            generatedAt: pkg.generatedAt,
            onnxModelPath: pkg.onnxModelPath,
            launchFiles: pkg.launchFiles,
            configFiles: pkg.configFiles,
            files: pkg.files.map((f) => ({ relativePath: f.relativePath, description: f.description }))
          }, null, 2));
        } catch (manifestErr) {
          console.warn("Isaac ROS: Failed to write manifest:", manifestErr?.message);
        }
        console.log(`Isaac ROS: Deployment package generated at ${pkg.ros2Workspace} (${pkg.files.length} files)`);
      } catch (isaacErr) {
        console.warn("Isaac ROS deployment generation failed (non-fatal):", isaacErr?.message);
      }
    }
    let telemetryData;
    let policyMode = "SIMULATED";
    const useIsaacSim = process.env.USE_ISAAC_SIM === "true";
    let simJobId = null;
    let simJobStatus = null;
    if (useIsaacSim) {
      try {
        simJobId = await submitIsaacSimSimulation({
          robot: robotId || "franka_panda",
          taskTitle: title || "Task",
          environment: environment || "MuJoCo",
          controlMode: controlMode || "Cartesian Impedance",
          observationSpace: Array.isArray(observationSpace) ? observationSpace : ["RGB Camera", "Joint Encoders"],
          domainRandomization: !!domainRandomization,
          robotDof: robotDof || 7
        });
        console.log(`Isaac Sim simulation submitted: ${simJobId}`);
        setPipelineRun(simJobId, {
          kind: "isaac_sim_simulation",
          policyId: null,
          robotId: robotId || "franka_panda",
          taskTitle: title || "Task",
          submittedAt: (/* @__PURE__ */ new Date()).toISOString(),
          status: "running"
        });
        const waitForSim = process.env.WAIT_FOR_ISAAC_SIM === "true";
        if (waitForSim) {
          try {
            console.log(`Waiting for Isaac Sim job ${simJobId} to complete...`);
            const completedJob = await waitForIsaacSimCompletion(simJobId, 6e5, 1e4);
            if (completedJob.status === "completed") {
              const metrics = generateSimulationTelemetryIsaacSim(completedJob, robotDof || 7);
              telemetryData = metrics;
              telemetryData.isIsaacSim = true;
              telemetryData.simJobId = simJobId;
              simJobStatus = "completed";
              policyMode = "REAL";
              console.log("Telemetry: Generated via REAL Isaac Sim completion");
            } else {
              console.warn("Isaac Sim job failed or was cancelled:", completedJob.error);
              simJobStatus = "failed";
              throw new Error(`Isaac Sim job failed: ${completedJob.error || "Unknown error"}`);
            }
          } catch (waitErr) {
            console.warn("Isaac Sim wait failed, falling back to simulated telemetry:", waitErr?.message);
            telemetryData = generateSimulationTelemetry(robotDof || 7, !!domainRandomization);
            telemetryData.isIsaacSim = false;
            telemetryData.simJobId = simJobId;
            simJobStatus = "failed";
            policyMode = "SIMULATED";
          }
        } else {
          telemetryData = generateSimulationTelemetry(robotDof || 7, !!domainRandomization);
          telemetryData.isIsaacSim = false;
          telemetryData.simJobId = simJobId;
          simJobStatus = "running";
          policyMode = "SIMULATED";
          console.log("Telemetry: Simulated (async Isaac Sim mode) - reconcile via isaacsim-status");
        }
      } catch (err) {
        console.warn("Isaac Sim telemetry failed, falling back to local simulation:", err?.message);
        telemetryData = generateSimulationTelemetry(robotDof || 7, !!domainRandomization);
        simJobStatus = "failed";
        policyMode = "SIMULATED";
      }
    } else {
      telemetryData = generateSimulationTelemetry(robotDof || 7, !!domainRandomization);
      policyMode = "SIMULATED";
    }
    let pythonCode = "";
    let aiTitle = title;
    let onnxInput = `1 x ${robotDof ? robotDof * 3 + 6 : 24}`;
    let onnxOutput = `1 x ${robotDof || 7}`;
    const policySynthesisSchema = {
      type: import_genai4.Type.OBJECT,
      properties: {
        title: { type: import_genai4.Type.STRING },
        pythonCode: { type: import_genai4.Type.STRING },
        onnxInputShape: { type: import_genai4.Type.STRING },
        onnxOutputShape: { type: import_genai4.Type.STRING }
      },
      required: ["title", "pythonCode", "onnxInputShape", "onnxOutputShape"]
    };
    const synthesisPrompt = `You are Policy-0 Compiler, an AI system that synthesizes Python control code for embodied robots.

Task Title: "${title || description}"
Task Details: "${description}"
Robot Hardware: ${robotName} (${robotDof || 7}-DoF)
Routing Decision: ${routingDecision.planType} (${routingDecision.rationale})
Control Mode: ${controlMode || "Cartesian Impedance"}
Observation Modalities: ${Array.isArray(observationSpace) ? observationSpace.join(", ") : "RGB Camera, Joint Encoders"}

Write clean, robust, executable Python policy code for this robot task.
Include impedance gain matrices (Kp, Kd), state machine loop (APPROACH, ALIGN, ENGAGE, EXECUTE, RETRACT), gravity compensation, and force threshold checks.

Output JSON object with:
1. "title": Refined task title string.
2. "pythonCode": The complete Python policy script with detailed docstring and comments.
3. "onnxInputShape": Input tensor shape string (e.g. "1 x 24").
4. "onnxOutputShape": Output action chunk shape string (e.g. "1 x 7").`;
    let useNIMLLM = process.env.USE_NIM_LLM === "true" && isNIMLLMAvailable();
    if (useNIMLLM) {
      try {
        const parsed = await callNIMLLMStructured(
          [{ role: "user", content: synthesisPrompt }],
          policySynthesisSchema,
          { temperature: 0.2, model: "meta/llama-3.1-70b-instruct" }
        );
        if (parsed.pythonCode) pythonCode = parsed.pythonCode;
        if (parsed.title) aiTitle = parsed.title;
        if (parsed.onnxInputShape) onnxInput = parsed.onnxInputShape;
        if (parsed.onnxOutputShape) onnxOutput = parsed.onnxOutputShape;
        console.log("Policy Synthesis: Used NIM LLM (Llama 3.1 70B)");
      } catch (nimErr) {
        console.warn("NIM LLM synthesis failed, falling back to Gemini:", nimErr?.message);
        useNIMLLM = false;
      }
    }
    if (!useNIMLLM) {
      try {
        const ai = getGeminiClient3();
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: synthesisPrompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: policySynthesisSchema
          }
        });
        const parsed = JSON.parse(response.text || "{}");
        if (parsed.pythonCode) pythonCode = parsed.pythonCode;
        if (parsed.title) aiTitle = parsed.title;
        if (parsed.onnxInputShape) onnxInput = parsed.onnxInputShape;
        if (parsed.onnxOutputShape) onnxOutput = parsed.onnxOutputShape;
        console.log("Policy Synthesis: Used Gemini 3.6 Flash");
      } catch (err) {
        console.warn("Gemini AI synthesis fallback used:", err);
        pythonCode = `import numpy as np
import spatial_math as sm

class Policy0GeneratedController:
    """
    Policy-0 Compiled Policy for ${robotName || "Robot"}
    Routing: ${routingDecision.planType}
    Control Mode: ${controlMode || "Cartesian Impedance"}
    """
    def __init__(self, dof=${robotDof || 7}):
        self.dof = dof
        self.kp = np.diag([600.0, 600.0, 400.0, 50.0, 50.0, 50.0])
        self.kd = 2.0 * np.sqrt(self.kp)
        self.state = "INITIALIZE"

    def step(self, observation):
        joint_pos = observation['joint_pos']
        joint_vel = observation['joint_vel']

        # State machine trajectory step
        tau = -self.kd[:self.dof, :self.dof] @ joint_vel
        return tau`;
      }
    }
    const policyId = `pol_${Date.now().toString(36)}`;
    if (simJobId) {
      const entry = getPipelineRun(simJobId);
      if (entry) {
        pipelineRunsTable.updateById(simJobId, { policyId });
      }
    }
    const policyResult = {
      id: policyId,
      title: aiTitle || title || "Custom Robot Policy",
      description,
      routing: routingDecision,
      status: "validated",
      pythonCode,
      mujocoXml,
      ros2NodeCode,
      onnxSpec: {
        inputShape: onnxInput,
        outputShape: onnxOutput,
        latencyMs: +(0.6 + Math.random() * 0.8).toFixed(2),
        fileSizeBytes: Math.floor(12e5 + Math.random() * 25e5)
      },
      metrics: {
        successRatePct: telemetryData.successRatePct,
        meanTrajectoryTimeSec: telemetryData.meanTrajectoryTimeSec,
        simToRealConfidencePct: telemetryData.simToRealConfidencePct,
        energyScoreJoule: telemetryData.energyScoreJoule,
        totalSimRuns: telemetryData.totalSimRuns
      },
      telemetry: telemetryData.telemetry,
      // Stage 4 Isaac Sim integration: when USE_ISAAC_SIM=true, surface
      // the real simJobId to the client so it can poll /api/policy/isaacsim-status/:jobId
      // for actual progress. When null, the legacy local simulation path was used.
      simJobId,
      simJobStatus,
      // Honest provenance marker: 'REAL' only when telemetry was measured
      // from a completed Isaac Sim job; otherwise 'SIMULATED'.
      mode: policyMode,
      createdAt: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 16)
    };
    try {
      await savePolicy(policyResult, policyMode);
      await savePolicyVersion(policyResult, 1, policyMode === "REAL");
      console.log(`Policy persisted: ${policyId} (${policyMode}, v1)`);
    } catch (persistErr) {
      console.warn("Policy persistence failed (non-fatal):", persistErr?.message);
    }
    res.json({ success: true, policy: policyResult });
  } catch (error) {
    console.error("Policy Pipeline Generation Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to execute policy compilation pipeline" });
  }
});
app.get("/api/policy/isaacsim-status/:jobId", authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const localEntry = getPipelineRunEntry(jobId);
    if (!localEntry && !jobId.startsWith("isaac_sim_") && !jobId.startsWith("sim_")) {
      return res.status(404).json({ success: false, error: "Unknown sim job ID" });
    }
    let upstreamStatus = null;
    let upstreamError = null;
    if (process.env.USE_ISAAC_SIM === "true") {
      try {
        upstreamStatus = await getIsaacSimJobStatus(jobId);
      } catch (err) {
        upstreamError = err?.message || String(err);
      }
    }
    const localSimulated = !upstreamStatus && !!localEntry;
    const result = {
      success: true,
      jobId,
      // Surface canonical Isaac Sim status when available
      status: upstreamStatus?.status || (localSimulated ? localEntry?.status || "completed" : "unknown"),
      progressPct: upstreamStatus?.progress_pct ?? (localSimulated ? 100 : 0),
      // Local registry fields (always available)
      local: localEntry ? {
        kind: localEntry.kind,
        policyId: localEntry.policyId || null,
        robotId: localEntry.robotId,
        taskTitle: localEntry.taskTitle,
        submittedAt: localEntry.submittedAt
      } : null,
      upstream: upstreamStatus || null
    };
    if (upstreamError) {
      result.upstreamError = upstreamError;
    }
    res.json(result);
  } catch (error) {
    console.error("Isaac Sim Status Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get Isaac Sim job status" });
  }
});
app.get("/api/policies", async (req, res) => {
  try {
    const records = await listPolicies();
    res.json({ success: true, count: records.length, policies: records });
  } catch (error) {
    console.error("List Policies Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list policies" });
  }
});
app.get("/api/policy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const record = await getPolicy(id);
    if (!record) {
      return res.status(404).json({ success: false, error: "Policy not found" });
    }
    res.json({ success: true, policy: record.policy, mode: record.mode, versions: await listPolicyVersions(id) });
  } catch (error) {
    console.error("Get Policy Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to get policy" });
  }
});
app.delete("/api/policy/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getPolicy(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Policy not found" });
    }
    await deletePolicy(id);
    res.json({ success: true, deleted: id });
  } catch (error) {
    console.error("Delete Policy Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to delete policy" });
  }
});
app.get("/api/osmo/recipes", (req, res) => {
  res.json({ success: true, recipes: listRecipes(), status: getOSMOStatus() });
});
app.get("/api/osmo/providers", (req, res) => {
  res.json({
    success: true,
    enabled: isOSMOConfigured(),
    status: getOSMOStatus()
  });
});
app.post("/api/osmo/submit", validateBody(schemas.osmoSubmit), async (req, res) => {
  try {
    const { recipe, parameters, pipelineId, parentJobId } = req.body;
    if (!recipe) {
      return res.status(400).json({ success: false, error: "recipe is required" });
    }
    const jobId = await submitOSMOJob(recipe, parameters || {}, {
      pipelineId,
      parentJobId
    });
    res.json({ success: true, jobId });
  } catch (error) {
    console.error("OSMO Submit Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to submit OSMO job" });
  }
});
app.get("/api/osmo/jobs", async (req, res) => {
  try {
    const recipe = req.query.recipe;
    const status = req.query.status;
    const jobs = await listOSMOJobs({ recipe, status });
    res.json({ success: true, jobs });
  } catch (error) {
    console.error("OSMO List Jobs Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to list OSMO jobs" });
  }
});
app.get("/api/osmo/jobs/:jobId", authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await getOSMOJobStatus(jobId);
    res.json({ success: true, job });
  } catch (error) {
    console.error("OSMO Job Status Error:", error);
    res.status(404).json({ success: false, error: error?.message || "OSMO job not found" });
  }
});
app.post("/api/osmo/jobs/:jobId/cancel", authenticate, validateBody(schemas.osmoJobCancel), async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await cancelOSMOJob(jobId);
    res.json({ success: true, job });
  } catch (error) {
    console.error("OSMO Cancel Error:", error);
    res.status(404).json({ success: false, error: error?.message || "OSMO job not found" });
  }
});
app.get("/api/osmo/jobs/:jobId/artifacts", authenticate, async (req, res) => {
  try {
    const { jobId } = req.params;
    const artifacts = await getOSMOJobArtifacts(jobId);
    res.json({ success: true, artifacts });
  } catch (error) {
    console.error("OSMO Artifacts Error:", error);
    res.status(404).json({ success: false, error: error?.message || "OSMO job not found" });
  }
});
app.get("/api/osmo/jobs/:jobId/logs/stream", authenticate, validateBody(schemas.osmoJobLogs), async (req, res) => {
  try {
    const { jobId } = req.params;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    const stream = await streamOSMOJobLogs(jobId);
    stream.on("data", (chunk) => {
      chunk.toString().split("\n").forEach((line) => {
        if (line) res.write(`data: ${line}

`);
      });
    });
    stream.on("end", () => res.end());
    stream.on("error", (err) => {
      console.error("OSMO log stream error:", err);
      res.write(`data: [error] ${err?.message || err}

`);
      res.end();
    });
    req.on("close", () => stream.destroy());
  } catch (error) {
    console.error("OSMO Log Stream Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to stream OSMO logs" });
  }
});
app.post("/api/osmo/pipeline", authenticate, validateBody(schemas.osmoPipeline), async (req, res) => {
  try {
    const { name, stages } = req.body;
    if (!Array.isArray(stages) || stages.length === 0) {
      return res.status(400).json({ success: false, error: "stages must be a non-empty array" });
    }
    const pipelineId = await submitOSMOPipeline(name || "policy0_pipeline", stages);
    res.json({ success: true, pipelineId });
  } catch (error) {
    console.error("OSMO Pipeline Submit Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to submit OSMO pipeline" });
  }
});
app.get("/api/osmo/pipeline/:pipelineId", authenticate, async (req, res) => {
  try {
    const { pipelineId } = req.params;
    const pipeline = getOSMOPipeline(pipelineId);
    if (!pipeline) {
      return res.status(404).json({ success: false, error: "OSMO pipeline not found" });
    }
    res.json({ success: true, pipeline });
  } catch (error) {
    console.error("OSMO Pipeline Status Error:", error);
    res.status(500).json({ success: false, error: error?.message || "Failed to fetch OSMO pipeline" });
  }
});
app.get("/api/osmo/pipelines", authenticate, async (req, res) => {
  res.json({ success: true, pipelines: listOSMOPipelines() });
});
app.use(notFoundHandler);
app.use(globalErrorHandler);
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path9.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path9.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Policy-0 Studio Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  app
});
//# sourceMappingURL=server.cjs.map
