export const SUPPLIER_NAMES = ['Supplier A', 'Supplier B'] as const;

export type SupplierName = (typeof SUPPLIER_NAMES)[number];

export interface HotelOffer {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
  supplier: SupplierName;
}

export interface FinalHotelOffer {
  name: string;
  price: number;
  supplier: SupplierName;
  commissionPct: number;
}

export interface HotelAggregationResult {
  city: string;
  hotels: FinalHotelOffer[];
  warnings: string[];
}
