import type { Request } from 'express';
import { normalizeCity } from '../../domain/hotel-key.js';
import { AppError } from '../../errors/app-error.js';

const CITY_PATTERN = /^[a-zA-Z][a-zA-Z\s-]{0,49}$/;

export interface HotelQuery {
  city: string;
  minPrice?: number;
  maxPrice?: number;
  hasPriceFilter: boolean;
}

export function parseHotelQuery(query: Request['query']): HotelQuery {
  const city = parseCity(query.city);
  const minPrice = parseOptionalPrice(query.minPrice, 'minPrice');
  const maxPrice = parseOptionalPrice(query.maxPrice, 'maxPrice');

  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    throw new AppError(400, 'INVALID_PRICE_RANGE', 'minPrice cannot be greater than maxPrice');
  }

  return {
    city,
    minPrice,
    maxPrice,
    hasPriceFilter: minPrice !== undefined || maxPrice !== undefined,
  };
}

export function parseCity(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'INVALID_CITY', 'city is required and must be a non-empty string');
  }
  if (!CITY_PATTERN.test(value.trim())) {
    throw new AppError(
      400,
      'INVALID_CITY',
      'city must start with a letter and contain only letters, spaces, or hyphens',
    );
  }
  return normalizeCity(value);
}

function parseOptionalPrice(value: unknown, field: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    throw new AppError(400, 'INVALID_PRICE', `${field} must be a single number`);
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new AppError(400, 'INVALID_PRICE', `${field} must be a number`);
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AppError(400, 'INVALID_PRICE', `${field} must be a number`);
  }
  if (parsed < 0) {
    throw new AppError(400, 'INVALID_PRICE', `${field} must be greater than or equal to 0`);
  }
  return parsed;
}
