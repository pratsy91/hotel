import { NativeConnection, Worker } from '@temporalio/worker';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';
import { connectRedis, disconnectRedis } from '../services/redis.service';
import * as activities from './activities/index.js';

async function run(): Promise<void> {
  await connectRedis();

  const connection = await connectWorker(30, 2000);
  const worker = await Worker.create({
    connection,
    namespace: env.temporalNamespace,
    taskQueue: env.temporalTaskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities,
  });

  logger.info('Temporal worker started', {
    taskQueue: env.temporalTaskQueue,
    namespace: env.temporalNamespace,
  });

  const shutdown = (): void => {
    logger.info('Shutting down Temporal worker');
    worker.shutdown();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await worker.run();
  } finally {
    await connection.close();
    await disconnectRedis();
  }
}

async function connectWorker(attempts: number, delayMs: number): Promise<NativeConnection> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await NativeConnection.connect({ address: env.temporalAddress });
    } catch (error) {
      lastError = error;
      logger.warn('Temporal worker connection failed', {
        attempt,
        address: env.temporalAddress,
        error: error instanceof Error ? error.message : 'unknown',
      });
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to connect Temporal worker');
}

run().catch((error: unknown) => {
  logger.error('Temporal worker failed', {
    error: error instanceof Error ? error.message : 'unknown',
  });
  process.exit(1);
});
