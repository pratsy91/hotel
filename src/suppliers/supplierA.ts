import { hotelsForCity } from './catalog.js';
import type { SupplierHotelPayload } from './types.js';

const CATALOG: Record<string, SupplierHotelPayload[]> = {
  delhi: [
    {
      hotelId: 'a1',
      name: 'Holtin',
      price: 6000,
      city: 'delhi',
      commissionPct: 10,
    },
    {
      hotelId: 'a2',
      name: 'Radison',
      price: 5900,
      city: 'delhi',
      commissionPct: 13,
    },
    {
      hotelId: 'a3',
      name: 'Taj Palace',
      price: 7500,
      city: 'delhi',
      commissionPct: 15,
    },
  ],
  mumbai: [],
};

export function listSupplierAHotels(city: string): SupplierHotelPayload[] {
  return hotelsForCity(CATALOG, city);
}
