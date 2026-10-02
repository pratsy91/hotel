import { ApplicationFailure } from '@temporalio/common';
import { log, proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities/index.js';
import type { HotelAggregationResult, HotelOffer } from '../../types/hotel.js';

const { getSupplierAHotels, getSupplierBHotels } = proxyActivities<typeof activities>({
  startToCloseTimeout: '20 seconds',
  scheduleToCloseTimeout: '90 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
    maximumInterval: '8 seconds',
  },
});

const { deduplicateHotelOffers } = proxyActivities<typeof activities>({
  startToCloseTimeout: '10 seconds',
  retry: {
    maximumAttempts: 2,
    initialInterval: '500 milliseconds',
  },
});

const { saveHotelsToRedis } = proxyActivities<typeof activities>({
  startToCloseTimeout: '15 seconds',
  scheduleToCloseTimeout: '45 seconds',
  retry: {
    maximumAttempts: 3,
    initialInterval: '1 second',
    backoffCoefficient: 2,
  },
});

type SupplierCallResult = { ok: true; hotels: HotelOffer[] } | { ok: false; message: string };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown supplier error';
}

/**
 * Fetch both suppliers at the same time, keep the cheaper offer per hotel name,
 * and persist the result through the Redis activity.
 * A single supplier failure does not fail the workflow.
 */
export async function hotelOfferWorkflow(city: string): Promise<HotelAggregationResult> {
  const normalizedCity = city.trim().toLowerCase();

  const [supplierAResult, supplierBResult] = await Promise.all([
    getSupplierAHotels(normalizedCity).then(
      (hotels): SupplierCallResult => ({ ok: true, hotels }),
      (error: unknown): SupplierCallResult => ({ ok: false, message: errorMessage(error) }),
    ),
    getSupplierBHotels(normalizedCity).then(
      (hotels): SupplierCallResult => ({ ok: true, hotels }),
      (error: unknown): SupplierCallResult => ({ ok: false, message: errorMessage(error) }),
    ),
  ]);

  const offers: HotelOffer[] = [];
  const warnings: string[] = [];

  if (supplierAResult.ok) {
    offers.push(...supplierAResult.hotels);
  } else {
    log.warn('Supplier A unavailable after retries', {
      city: normalizedCity,
      message: supplierAResult.message,
    });
    warnings.push('Supplier A is unavailable. Results include Supplier B only.');
  }

  if (supplierBResult.ok) {
    offers.push(...supplierBResult.hotels);
  } else {
    log.warn('Supplier B unavailable after retries', {
      city: normalizedCity,
      message: supplierBResult.message,
    });
    warnings.push('Supplier B is unavailable. Results include Supplier A only.');
  }

  if (!supplierAResult.ok && !supplierBResult.ok) {
    throw ApplicationFailure.nonRetryable(
      'Both hotel suppliers are unavailable',
      'SuppliersUnavailable',
    );
  }

  const hotels = await deduplicateHotelOffers(offers);
  await saveHotelsToRedis(normalizedCity, hotels);

  return {
    city: normalizedCity,
    hotels,
    warnings,
  };
}
