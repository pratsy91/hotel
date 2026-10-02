import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { deduplicateHotelOffers } from '../src/domain/deduplicate-hotels';
import type { HotelOffer } from '../src/types/hotel';

function offer(partial: HotelOffer): HotelOffer {
  return partial;
}

describe('deduplicateHotelOffers', () => {
  it('keeps the cheaper offer when both suppliers list the same hotel', () => {
    const hotels = deduplicateHotelOffers([
      offer({
        hotelId: 'a1',
        name: 'Holtin',
        price: 6000,
        city: 'delhi',
        commissionPct: 10,
        supplier: 'Supplier A',
      }),
      offer({
        hotelId: 'b1',
        name: 'Holtin',
        price: 5340,
        city: 'delhi',
        commissionPct: 20,
        supplier: 'Supplier B',
      }),
    ]);

    assert.deepEqual(hotels, [
      {
        name: 'Holtin',
        price: 5340,
        supplier: 'Supplier B',
        commissionPct: 20,
      },
    ]);
  });

  it('keeps hotels that exist on only one supplier', () => {
    const hotels = deduplicateHotelOffers([
      offer({
        hotelId: 'a2',
        name: 'Radison',
        price: 5900,
        city: 'delhi',
        commissionPct: 13,
        supplier: 'Supplier A',
      }),
      offer({
        hotelId: 'b3',
        name: 'Marriott',
        price: 8000,
        city: 'delhi',
        commissionPct: 18,
        supplier: 'Supplier B',
      }),
    ]);

    assert.deepEqual(
      hotels.map((hotel) => hotel.name),
      ['Radison', 'Marriott'],
    );
  });

  it('matches hotel names case-insensitively and prefers higher commission on a price tie', () => {
    const hotels = deduplicateHotelOffers([
      offer({
        hotelId: 'a1',
        name: 'Holtin',
        price: 5000,
        city: 'delhi',
        commissionPct: 10,
        supplier: 'Supplier A',
      }),
      offer({
        hotelId: 'b1',
        name: 'holtin',
        price: 5000,
        city: 'delhi',
        commissionPct: 20,
        supplier: 'Supplier B',
      }),
    ]);

    assert.equal(hotels.length, 1);
    assert.equal(hotels[0]?.supplier, 'Supplier B');
    assert.equal(hotels[0]?.commissionPct, 20);
  });

  it('returns hotels sorted by price', () => {
    const hotels = deduplicateHotelOffers([
      offer({
        hotelId: 'b3',
        name: 'Marriott',
        price: 8000,
        city: 'delhi',
        commissionPct: 18,
        supplier: 'Supplier B',
      }),
      offer({
        hotelId: 'b1',
        name: 'Holtin',
        price: 5340,
        city: 'delhi',
        commissionPct: 20,
        supplier: 'Supplier B',
      }),
    ]);

    assert.deepEqual(
      hotels.map((hotel) => hotel.price),
      [5340, 8000],
    );
  });
});
