import { createClient } from 'redis';
import { env } from '../config/env.js';
import { hotelMemberKey, normalizeCity } from '../domain/hotel-key.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../logger/logger.js';
import { cityMetaKey, hotelDataKey, priceIndexKey } from '../redis/keys.js';
import type { FinalHotelOffer } from '../types/hotel.js';

type AppRedisClient = ReturnType<typeof createClient>;

let client: AppRedisClient | null = null;

export async function connectRedis(): Promise<void> {
  if (client?.isOpen) {
    return;
  }

  const next = createClient({ url: env.redisUrl });
  next.on('error', (error: Error) => {
    logger.error('Redis client error', { error: error.message });
  });

  await next.connect();
  client = next;
  logger.info('Connected to Redis', { url: env.redisUrl });
}

export async function disconnectRedis(): Promise<void> {
  if (!client) {
    return;
  }
  await client.quit();
  client = null;
}

export async function pingRedis(): Promise<boolean> {
  try {
    const redis = await getRedis();
    const response = await redis.ping();
    return response === 'PONG';
  } catch (error) {
    logger.warn('Redis ping failed', { error: error instanceof Error ? error.message : 'unknown' });
    return false;
  }
}

/**
 * Replace the city's deduplicated hotel set.
 *
 * hotels:price:<city>              ZSET  score = price, member = hotel key
 * hotels:data:<city>:<hotelKey>    STRING JSON FinalHotelOffer
 * hotels:meta:<city>               STRING JSON metadata used to detect a completed aggregation
 */
export async function saveDeduplicatedHotels(
  city: string,
  hotels: FinalHotelOffer[],
): Promise<void> {
  const redis = await getRedis();
  const normalizedCity = normalizeCity(city);
  const indexKey = priceIndexKey(normalizedCity);

  try {
    const existingMembers = await redis.zRange(indexKey, 0, -1);
    const transaction = redis.multi();

    if (existingMembers.length > 0) {
      transaction.del(existingMembers.map((member) => dataKeyForMember(normalizedCity, member)));
    }
    transaction.del(indexKey);

    if (hotels.length > 0) {
      transaction.zAdd(
        indexKey,
        hotels.map((hotel) => ({
          score: hotel.price,
          value: hotelMemberKey(hotel.name),
        })),
      );

      for (const hotel of hotels) {
        transaction.set(hotelDataKey(normalizedCity, hotel.name), JSON.stringify(hotel));
      }
    }

    transaction.set(
      cityMetaKey(normalizedCity),
      JSON.stringify({
        updatedAt: new Date().toISOString(),
        count: hotels.length,
      }),
    );

    await transaction.exec();
    logger.info('Saved deduplicated hotels to Redis', {
      city: normalizedCity,
      count: hotels.length,
    });
  } catch (error) {
    throw asRedisError(error);
  }
}

/**
 * Price filtering is performed by Redis sorted-set range query (ZRANGEBYSCORE).
 * Hotel JSON is loaded only for members inside that range.
 */
export async function queryHotelsByPrice(
  city: string,
  minPrice?: number,
  maxPrice?: number,
): Promise<FinalHotelOffer[]> {
  const redis = await getRedis();
  const normalizedCity = normalizeCity(city);
  const metaKey = cityMetaKey(normalizedCity);

  try {
    const aggregated = await redis.exists(metaKey);
    if (aggregated === 0) {
      throw new AppError(
        404,
        'NO_AGGREGATED_DATA',
        `No aggregated hotel data for "${normalizedCity}". Call GET /api/hotels?city=${normalizedCity} before filtering by price.`,
      );
    }

    const min = minPrice === undefined ? '-inf' : minPrice;
    const max = maxPrice === undefined ? '+inf' : maxPrice;
    const members = await redis.zRangeByScore(priceIndexKey(normalizedCity), min, max);

    if (members.length === 0) {
      return [];
    }

    const rawHotels = await redis.mGet(
      members.map((member) => dataKeyForMember(normalizedCity, member)),
    );

    const hotels = rawHotels
      .filter((value): value is string => typeof value === 'string')
      .map((value) => parseStoredHotel(value));

    return hotels.sort(
      (left, right) => left.price - right.price || left.name.localeCompare(right.name),
    );
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw asRedisError(error);
  }
}

async function getRedis(): Promise<AppRedisClient> {
  if (!client?.isOpen) {
    await connectRedis();
  }
  if (!client) {
    throw new AppError(503, 'REDIS_UNAVAILABLE', 'Hotel data store is unavailable');
  }
  return client;
}

function dataKeyForMember(city: string, member: string): string {
  return `hotels:data:${normalizeCity(city)}:${member}`;
}

function parseStoredHotel(value: string): FinalHotelOffer {
  const parsed: unknown = JSON.parse(value);
  if (!isFinalHotelOffer(parsed)) {
    throw new AppError(500, 'CORRUPT_HOTEL_DATA', 'Stored hotel data is invalid');
  }
  return parsed;
}

function isFinalHotelOffer(value: unknown): value is FinalHotelOffer {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const hotel = value as Record<string, unknown>;
  return (
    typeof hotel.name === 'string' &&
    typeof hotel.price === 'number' &&
    (hotel.supplier === 'Supplier A' || hotel.supplier === 'Supplier B') &&
    typeof hotel.commissionPct === 'number'
  );
}

function asRedisError(error: unknown): AppError {
  logger.error('Redis command failed', {
    error: error instanceof Error ? error.message : 'unknown',
  });
  return new AppError(503, 'REDIS_UNAVAILABLE', 'Hotel data store is unavailable');
}
