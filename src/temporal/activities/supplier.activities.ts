import { log } from '@temporalio/activity';
import { env } from '../../config/env.js';
import type { SupplierHotelPayload } from '../../suppliers/types.js';
import type { HotelOffer, SupplierName } from '../../types/hotel.js';

const REQUEST_TIMEOUT_MS = 8000;

export async function getSupplierAHotels(city: string): Promise<HotelOffer[]> {
  return fetchSupplierHotels('/supplierA/hotels', city, 'Supplier A');
}

export async function getSupplierBHotels(city: string): Promise<HotelOffer[]> {
  return fetchSupplierHotels('/supplierB/hotels', city, 'Supplier B');
}

async function fetchSupplierHotels(
  path: string,
  city: string,
  supplier: SupplierName,
): Promise<HotelOffer[]> {
  const url = new URL(path, `${env.supplierBaseUrl}/`);
  url.searchParams.set('city', city);

  log.info('Requesting supplier hotels', { supplier, city, url: url.toString() });

  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`${supplier} returned HTTP ${response.status}`);
  }

  const body: unknown = await response.json();
  if (!Array.isArray(body) || !body.every(isSupplierHotelPayload)) {
    throw new Error(`${supplier} returned an unexpected payload`);
  }

  return body.map((hotel) => ({
    hotelId: hotel.hotelId,
    name: hotel.name,
    price: hotel.price,
    city: hotel.city,
    commissionPct: hotel.commissionPct,
    supplier,
  }));
}

function isSupplierHotelPayload(value: unknown): value is SupplierHotelPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const hotel = value as Record<string, unknown>;
  return (
    typeof hotel.hotelId === 'string' &&
    typeof hotel.name === 'string' &&
    typeof hotel.price === 'number' &&
    Number.isFinite(hotel.price) &&
    typeof hotel.city === 'string' &&
    typeof hotel.commissionPct === 'number' &&
    Number.isFinite(hotel.commissionPct)
  );
}
