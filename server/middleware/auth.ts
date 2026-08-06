import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AuthenticationError, AuthorizationError, NotFoundError } from './errors';

// ===== JWT Configuration =====
const JWT_SECRET = process.env.JWT_SECRET || 'policy0-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ===== Types =====
export interface JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  requestId?: string;
}

// ===== Token Generation =====
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired');
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw err;
  }
}

// ===== Authentication Middleware =====
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    const payload = verifyToken(token);
    
    (req as any).user = payload;
    next();
  } catch (err) {
    if (err instanceof AuthenticationError) {
      logger.warn({ ip: req.ip, path: req.path, error: err.message }, 'Authentication failed');
      res.status(401).json({
        success: false,
        error: err.message,
        code: err.code,
      });
      return;
    }
    next(err);
  }
}

// ===== Optional Authentication (for endpoints that work with or without auth) =====
export function optionalAuthenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      (req as any).user = payload;
    }
    next();
  } catch (err) {
    // Ignore auth errors for optional auth
    next();
  }
}

// ===== Role-Based Access Control =====
type Role = 'admin' | 'operator' | 'viewer';

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  operator: 2,
  viewer: 1,
};

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      throw new (require('./errors').AuthenticationError)('Authentication required');
    }

    const userLevel = roleHierarchy[user.role];
    const requiredLevel = Math.max(...allowedRoles.map(r => roleHierarchy[r]));

    if (userLevel < requiredLevel) {
      throw new (require('./errors').AuthorizationError)(`Requires one of: ${allowedRoles.join(', ')}`);
    }

    next();
  };
}

// ===== Resource Ownership Check =====
export function requireOwnership(getResourceOwnerId: (req: Request) => Promise<string | null>) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = (req as any).user;
    
    if (!user) {
      throw new (require('./errors').AuthenticationError)('Authentication required');
    }

    // Admins can access everything
    if (user.role === 'admin') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (!ownerId) {
        throw new (require('./errors').NotFoundError)('Resource');
      }

      if (ownerId !== user.userId) {
        throw new (require('./errors').AuthorizationError)('You can only access your own resources');
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

// ===== Token Refresh =====
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const payload = verifyToken(refreshToken);
    
    // Generate new token pair
    const newAccessToken = generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
    
    const newRefreshToken = generateRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });
    
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (err) {
    throw new (require('./errors').AuthenticationError)('Invalid refresh token');
  }
}

// ===== Password Utilities (for local auth) =====
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===== API Key Authentication (Legacy Support) =====
// Endpoints that must stay public even when an API key is configured.
const PUBLIC_PATH_PREFIXES = [
  '/api/health',
  '/api/vlm/providers',
  '/api/osmo/providers',
  '/api/osmo/recipes',
  '/api/auth',
  '/health',
  '/metrics',
];

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.POLICY0_API_KEY;

  // Public endpoints are always reachable
  if (PUBLIC_PATH_PREFIXES.some((p) => req.path.startsWith(p))) {
    return next();
  }

  // Skip if no API key configured (dev mode)
  if (!validApiKey) {
    return next();
  }

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: 'Invalid or missing API key',
      code: 'INVALID_API_KEY',
    });
    return;
  }

  next();
}

// ===== Audit Logging =====
// Logs all data-mutating operations (POST, PUT, DELETE, PATCH) for compliance and debugging.
export function auditLog(req: Request, res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  const user = (req as any).user;
  const userId = user?.userId || 'anonymous';
  const userEmail = user?.email || 'unknown';
  const userRole = user?.role || 'unknown';

  // Capture the original json method to intercept the response
  const originalJson = res.json.bind(res);
  let responseBody: any = null;

  res.json = (body: any) => {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      requestId: (req as any).requestId,
      userId,
      userEmail,
      userRole,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: req.ip ?? req.socket?.remoteAddress ?? 'unknown',
      userAgent: req.headers['user-agent'],
      // Don't log sensitive data like passwords or tokens
      body: sanitizeAuditBody(req.body),
      responseSuccess: responseBody?.success,
      responseErrorCode: responseBody?.code,
    };

    logger.info(auditEntry, 'audit_log');
  });

  next();
}

// Sanitize sensitive fields from audit logs
function sanitizeAuditBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'apiKey', 'secret'];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}