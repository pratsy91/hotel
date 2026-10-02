import type { SupplierHotelPayload } from './types.js';

export function hotelsForCity(
  catalog: Readonly<Record<string, readonly SupplierHotelPayload[]>>,
  city: string,
): SupplierHotelPayload[] {
  const key = city.trim().toLowerCase();
  const hotels = catalog[key];
  return hotels ? hotels.map((hotel) => ({ ...hotel })) : [];
}
