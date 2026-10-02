import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './logger/logger.js';
import { disconnectRedis, connectRedis } from './services/redis.service';
import { connectTemporal, disconnectTemporal } from './temporal/client.js';

async function start(): Promise<void> {
  await connectRedis();
  await connectTemporal();

  const app = createApp();
  const server = app.listen(env.port, '0.0.0.0', () => {
    logger.info('Hotel Offer Orchestrator API listening', { port: env.port });
  });

  const shutdown = (signal: string): void => {
    logger.info('Shutting down API', { signal });
    server.close(() => {
      Promise.all([disconnectRedis(), disconnectTemporal()])
        .then(() => process.exit(0))
        .catch((error: unknown) => {
          logger.error('Shutdown failed', {
            error: error instanceof Error ? error.message : 'unknown',
          });
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((error: unknown) => {
  logger.error('API failed to start', {
    error: error instanceof Error ? error.message : 'unknown',
  });
  process.exit(1);
});
