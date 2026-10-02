import { Client, Connection } from '@temporalio/client';
import { env } from '../config/env.js';
import { logger } from '../logger/logger.js';

let client: Client | null = null;

export async function connectTemporal(attempts = 30, delayMs = 2000): Promise<Client> {
  if (client) {
    return client;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const connection = await Connection.connect({ address: env.temporalAddress });
      client = new Client({ connection, namespace: env.temporalNamespace });
      logger.info('Connected to Temporal', {
        address: env.temporalAddress,
        namespace: env.temporalNamespace,
      });
      return client;
    } catch (error) {
      lastError = error;
      logger.warn('Temporal connection failed', {
        attempt,
        address: env.temporalAddress,
        error: error instanceof Error ? error.message : 'unknown',
      });
      await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to connect to Temporal');
}

export async function getTemporalClient(): Promise<Client> {
  return connectTemporal();
}

export async function disconnectTemporal(): Promise<void> {
  if (!client) {
    return;
  }
  await client.connection.close();
  client = null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
