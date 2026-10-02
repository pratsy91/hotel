import { hotelMemberKey, normalizeCity } from '../domain/hotel-key.js';

export function priceIndexKey(city: string): string {
  return `hotels:price:${normalizeCity(city)}`;
}

export function hotelDataKey(city: string, hotelName: string): string {
  return `hotels:data:${normalizeCity(city)}:${hotelMemberKey(hotelName)}`;
}

export function cityMetaKey(city: string): string {
  return `hotels:meta:${normalizeCity(city)}`;
}
