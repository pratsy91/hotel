import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { logger } from '../../logger/logger.js';
import { pingRedis } from '../../services/redis.service';

type CheckStatus = 'healthy' | 'unhealthy';
type OverallStatus = 'healthy' | 'degraded' | 'unhealthy';

interface HealthReport {
  status: OverallStatus;
  redis: CheckStatus;
  supplierA: CheckStatus;
  supplierB: CheckStatus;
}

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const [redis, supplierA, supplierB] = await Promise.all([
    checkRedis(),
    checkSupplier('/supplierA/hotels'),
    checkSupplier('/supplierB/hotels'),
  ]);

  const status = overallStatus(redis, supplierA, supplierB);
  const body: HealthReport = { status, redis, supplierA, supplierB };
  const httpStatus = status === 'healthy' ? 200 : 503;
  res.status(httpStatus).json(body);
}

async function checkRedis(): Promise<CheckStatus> {
  return (await pingRedis()) ? 'healthy' : 'unhealthy';
}

async function checkSupplier(path: string): Promise<CheckStatus> {
  const url = new URL(path, `${env.supplierBaseUrl}/`);
  url.searchParams.set('city', 'delhi');

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    logger.warn('Supplier health check failed', {
      path,
      error: error instanceof Error ? error.message : 'unknown',
    });
    return 'unhealthy';
  }
}

function overallStatus(
  redis: CheckStatus,
  supplierA: CheckStatus,
  supplierB: CheckStatus,
): OverallStatus {
  if (redis === 'unhealthy' || (supplierA === 'unhealthy' && supplierB === 'unhealthy')) {
    return 'unhealthy';
  }
  if (supplierA === 'unhealthy' || supplierB === 'unhealthy') {
    return 'degraded';
  }
  return 'healthy';
}
