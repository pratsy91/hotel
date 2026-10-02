import { log } from '@temporalio/activity';
import { saveDeduplicatedHotels } from '../../services/redis.service';
import type { FinalHotelOffer } from '../../types/hotel.js';

export async function saveHotelsToRedis(city: string, hotels: FinalHotelOffer[]): Promise<void> {
  log.info('Persisting deduplicated hotels', { city, count: hotels.length });
  await saveDeduplicatedHotels(city, hotels);
}
