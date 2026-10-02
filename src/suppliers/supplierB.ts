import { hotelsForCity } from './catalog.js';
import type { SupplierHotelPayload } from './types.js';

const CATALOG: Record<string, SupplierHotelPayload[]> = {
  delhi: [
    {
      hotelId: 'b1',
      name: 'Holtin',
      price: 5340,
      city: 'delhi',
      commissionPct: 20,
    },
    {
      hotelId: 'b2',
      name: 'Radison',
      price: 6200,
      city: 'delhi',
      commissionPct: 11,
    },
    {
      hotelId: 'b3',
      name: 'Marriott',
      price: 8000,
      city: 'delhi',
      commissionPct: 18,
    },
  ],
  mumbai: [],
};

export function listSupplierBHotels(city: string): SupplierHotelPayload[] {
  return hotelsForCity(CATALOG, city);
}
