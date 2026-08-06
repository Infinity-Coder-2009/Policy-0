import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { logger } from '../utils/logger';

// ===== CORS Configuration =====
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://policy-0.com',
      'https://www.policy-0.com',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS blocked origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-request-id'],
  exposedHeaders: ['x-request-id'],
  maxAge: 86400, // 24 hours
});

// ===== Rate Limiting =====
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: 60,
    });
  },
});

export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || 'unknown',
});

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many uploads, please try again later.' },
  keyGenerator: (req) => req.ip || 'unknown',
});

// ===== Zod Validation Schemas =====
import { z } from 'zod';

export const schemas = {
  // Video upload
  videoUpload: z.object({
    fileName: z.string().min(1).max(255),
    fileSizeBytes: z.number().positive().max(500 * 1024 * 1024), // 500MB max
    mimeType: z.enum(['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']),
  }),

  // VLM Analysis
  analyzeVLM: z.object({
    videoUploadId: z.string().min(1),
    description: z.string().optional(),
  }),

  analyzeDescription: z.object({
    description: z.string().min(1).max(5000),
  }),

  // Video Generation
  generateVideo: z.object({
    taskTitle: z.string().min(1).max(200),
    taskDescription: z.string().max(5000).optional(),
    robotModel: z.string().min(1).max(100).optional(),
    robotDof: z.number().int().positive().max(50).optional(),
    controlMode: z.enum(['Cartesian Impedance', 'Joint Velocity', 'Delta EE Pose', 'Action Chunks']).optional(),
    resolution: z.enum(['720p', '1080p', '4K']).optional(),
    durationSec: z.number().int().positive().max(300).optional(),
    domainRandomization: z.boolean().optional(),
  }),

  // Policy Generation
  generatePolicy: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    robotId: z.string().min(1).max(100).optional(),
    robotName: z.string().min(1).max(200).optional(),
    robotDof: z.number().int().positive().max(50).optional(),
    robotType: z.string().min(1).max(50).optional(),
    environment: z.enum(['MuJoCo', 'Isaac Sim', 'Drake', 'PyBullet']).optional(),
    controlMode: z.enum(['Cartesian Impedance', 'Joint Velocity', 'Delta EE Pose', 'Action Chunks']).optional(),
    observationSpace: z.array(z.string()).optional(),
    videoName: z.string().optional(),
    domainRandomization: z.boolean().optional(),
    maxExecutionTimeSec: z.number().int().positive().max(3600).optional(),
  }),

  // ONNX Export
  onnxExport: z.object({
    policy: z.object({
      id: z.string(),
      onnxSpec: z.object({
        inputShape: z.string(),
        outputShape: z.string(),
      }).passthrough(),
    }).passthrough(), // retain robot/routing/pythonCode needed by the exporter
    format: z.enum(['onnx', 'tensorrt', 'onnx-tensorrt']).optional(),
    optimize: z.boolean().optional(),
    quantization: z.enum(['fp32', 'fp16', 'int8']).nullable().optional(),
  }),

  // Approval
  approval: z.object({
    approvalId: z.string(),
    decision: z.enum(['approved', 'rejected', 'revision_requested']),
    policyId: z.string().optional(),
    feedback: z.string().max(2000).optional(),
  }),

  // Isaac Lab Training
  isaacLabTrain: z.object({
    robot: z.string().min(1),
    taskTitle: z.string().min(1).max(200),
    controlMode: z.string().optional(),
    observationSpace: z.array(z.string()).optional(),
    domainRandomization: z.boolean().optional(),
    robotDof: z.number().int().positive().max(50).optional(),
    planType: z.string().optional(),
  }),

  // Isaac Sim Simulation
  isaacSimSimulate: z.object({
    robot: z.string().min(1),
    taskTitle: z.string().min(1),
    environment: z.string().optional(),
    controlMode: z.string().optional(),
    observationSpace: z.array(z.string()).optional(),
    domainRandomization: z.boolean().optional(),
    robotDof: z.number().int().positive().max(50).optional(),
  }),

  // Telemetry Collection
  telemetryCollect: z.object({
    policyId: z.string().min(1),
    robotModel: z.string().optional(),
    taskTitle: z.string().optional(),
    outcome: z.enum(['success', 'failure', 'partial']),
    successScore: z.number().min(0).max(100).optional(),
    durationSec: z.number().positive().optional(),
    numAttempts: z.number().int().positive().optional(),
    errorSignals: z.array(z.object({
      type: z.string(),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      description: z.string(),
      occurredAtSec: z.number().nonnegative(),
    })).optional(),
    environmentFingerprint: z.string().optional(),
    source: z.enum(['sim', 'real_world']).optional(),
    deviceSerial: z.string().optional(),
  }),

  // Improvements
  improvementsGenerate: z.object({
    useLLM: z.boolean().optional(),
  }),

  improvementApply: z.object({
    improvementId: z.string().min(1),
  }),

  // Evolution
  evolutionRegenerate: z.object({
    policy: z.any(), // GeneratedPolicy is complex, validated separately
  }),

  // Approval
  createApproval: z.object({
    videoGenerationId: z.string().min(1),
    expiresInHours: z.number().int().positive().max(168).optional(), // max 1 week
  }),

  // Telemetry simulate
  telemetrySimulate: z.object({
    policyId: z.string().min(1),
    source: z.enum(['sim', 'real_world']).optional(),
  }),

  // Isaac Lab wait
  isaacLabWait: z.object({
    jobId: z.string().min(1),
    timeoutMs: z.number().int().positive().max(3600000).optional(), // max 1 hour
  }),

  // Isaac Lab export ONNX
  isaacLabExportOnnx: z.object({
    policyId: z.string().min(1),
    checkpointId: z.string().optional(),
  }),

  // Isaac Lab register checkpoint
  isaacLabRegisterCheckpoint: z.object({
    policyId: z.string().min(1),
    checkpointPath: z.string().min(1),
    metrics: z.record(z.string(), z.number()).optional(),
  }),

  // OSMO job cancel
  osmoJobCancel: z.object({
    jobId: z.string().min(1),
  }),

  // OSMO job logs stream
  osmoJobLogs: z.object({
    jobId: z.string().min(1),
    follow: z.boolean().optional(),
  }),

  // OSMO
  osmoSubmit: z.object({
    recipe: z.enum([
      'isaac_sim_policy_training',
      'isaac_lab_rl_training',
      'isaac_sim_render',
      'leapp_onnx_export',
    ]),
    parameters: z.record(z.string(), z.any()).optional(),
    pipelineId: z.string().optional(),
    parentJobId: z.string().optional(),
  }),

  osmoPipeline: z.object({
    name: z.string().optional(),
    stages: z.array(z.object({
      recipe: z.enum([
        'isaac_sim_policy_training',
        'isaac_lab_rl_training',
        'isaac_sim_render',
        'leapp_onnx_export',
      ]),
      parameters: z.record(z.string(), z.any()),
      outputMapping: z.record(z.string(), z.string()).optional(),
    })).min(1),
  }),

  // Isaac Sim status
  isaacSimStatus: z.object({
    jobId: z.string().min(1),
  }),
};

// ===== Validation Middleware Factory =====
export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.query = result.data as any;
    next();
  };
}

export function validateParams(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid path parameters',
        details: result.error.flatten().fieldErrors,
      });
    }
    req.params = result.data as any;
    next();
  };
}

// ===== Combined Middleware Helpers =====
export function createRouteMiddleware(options: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
  rateLimiter?: ReturnType<typeof rateLimit>;
}) {
  const middlewares: any[] = [];

  if (options.rateLimiter) {
    middlewares.push(options.rateLimiter);
  }

  if (options.body) {
    middlewares.push(validateBody(options.body));
  }

  if (options.query) {
    middlewares.push(validateQuery(options.query));
  }

  if (options.params) {
    middlewares.push(validateParams(options.params));
  }

  return middlewares;
}