import { deduplicateHotelOffers as dedupe } from '../../domain/deduplicate-hotels.js';
import type { FinalHotelOffer, HotelOffer } from '../../types/hotel.js';

export async function deduplicateHotelOffers(offers: HotelOffer[]): Promise<FinalHotelOffer[]> {
  return dedupe(offers);
}
