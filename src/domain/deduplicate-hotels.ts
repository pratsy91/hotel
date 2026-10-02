import type { FinalHotelOffer, HotelOffer } from '../types/hotel.js';

/**
 * Collapse offers that share a hotel name.
 * The cheaper price wins. When prices are equal, the higher commission wins.
 * Hotels offered by only one supplier are kept.
 */
export function deduplicateHotelOffers(offers: HotelOffer[]): FinalHotelOffer[] {
  const winners = new Map<string, HotelOffer>();

  for (const offer of offers) {
    const key = offer.name.trim().toLowerCase();
    if (key.length === 0) {
      continue;
    }

    const current = winners.get(key);
    if (!current || isBetterOffer(offer, current)) {
      winners.set(key, offer);
    }
  }

  return [...winners.values()]
    .map(toFinalOffer)
    .sort((left, right) => left.price - right.price || left.name.localeCompare(right.name));
}

function isBetterOffer(candidate: HotelOffer, current: HotelOffer): boolean {
  if (candidate.price !== current.price) {
    return candidate.price < current.price;
  }
  return candidate.commissionPct > current.commissionPct;
}

function toFinalOffer(offer: HotelOffer): FinalHotelOffer {
  return {
    name: offer.name.trim(),
    price: offer.price,
    supplier: offer.supplier,
    commissionPct: offer.commissionPct,
  };
}
