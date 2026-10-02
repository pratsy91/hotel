import { WorkflowIdConflictPolicy, WorkflowIdReusePolicy } from '@temporalio/client';
import { env } from '../config/env.js';
import { normalizeCity } from '../domain/hotel-key.js';
import { logger } from '../logger/logger.js';
import { getTemporalClient } from '../temporal/client.js';
import { hotelOfferWorkflow } from '../temporal/workflows/index.js';
import type { HotelAggregationResult } from '../types/hotel.js';

export async function aggregateHotels(city: string): Promise<HotelAggregationResult> {
  const normalizedCity = normalizeCity(city);
  const client = await getTemporalClient();
  const workflowId = `hotel-offer-${normalizedCity.replace(/[^a-z0-9]+/g, '-')}`;

  logger.info('Starting hotel offer workflow', { city: normalizedCity, workflowId });

  const handle = await client.workflow.start(hotelOfferWorkflow, {
    taskQueue: env.temporalTaskQueue,
    workflowId,
    workflowIdReusePolicy: WorkflowIdReusePolicy.ALLOW_DUPLICATE,
    workflowIdConflictPolicy: WorkflowIdConflictPolicy.USE_EXISTING,
    args: [normalizedCity],
    workflowExecutionTimeout: '2 minutes',
  });

  const result = await handle.result();
  logger.info('Hotel offer workflow completed', {
    city: normalizedCity,
    workflowId,
    count: result.hotels.length,
    warnings: result.warnings.length,
  });
  return result;
}
