export interface AppEnv {
  nodeEnv: string;
  port: number;
  logLevel: string;
  redisUrl: string;
  temporalAddress: string;
  temporalNamespace: string;
  temporalTaskQueue: string;
  supplierBaseUrl: string;
}

function readString(name: string, fallback: string): string {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  return value.trim();
}

function readPort(): number {
  const raw = readString('PORT', '3000');
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT must be an integer between 1 and 65535. Received "${raw}".`);
  }
  return port;
}

export const env: AppEnv = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: readPort(),
  logLevel: readString('LOG_LEVEL', 'info'),
  redisUrl: readString('REDIS_URL', 'redis://127.0.0.1:6379'),
  temporalAddress: readString('TEMPORAL_ADDRESS', '127.0.0.1:7233'),
  temporalNamespace: readString('TEMPORAL_NAMESPACE', 'default'),
  temporalTaskQueue: readString('TEMPORAL_TASK_QUEUE', 'hotel-offer-task-queue'),
  supplierBaseUrl: readString('SUPPLIER_BASE_URL', `http://127.0.0.1:${readPort()}`).replace(
    /\/+$/,
    '',
  ),
};

export const isProduction = env.nodeEnv === 'production';
