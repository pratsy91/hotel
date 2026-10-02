import type { Request, Response } from 'express';
import { aggregateHotels } from '../../services/hotel.service';
import { queryHotelsByPrice } from '../../services/redis.service';
import type { FinalHotelOffer } from '../../types/hotel.js';
import { parseHotelQuery } from '../validators/hotel-query.validator';

export async function getHotels(req: Request, res: Response): Promise<void> {
  const query = parseHotelQuery(req.query);
  const result = await aggregateHotels(query.city);

  const hotels: FinalHotelOffer[] = query.hasPriceFilter
    ? await queryHotelsByPrice(query.city, query.minPrice, query.maxPrice)
    : result.hotels;

  res.status(200).json(hotels);
}
