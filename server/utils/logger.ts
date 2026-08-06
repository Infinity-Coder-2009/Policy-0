import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  base: {
    service: 'policy0',
    version: '4.0.0',
  },
});

export { logger };

export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}