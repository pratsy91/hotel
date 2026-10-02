import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../src/errors/app-error';
import { parseHotelQuery } from '../src/api/validators/hotel-query.validator';

describe('parseHotelQuery', () => {
  it('normalizes a valid city and reports that no price filter was requested', () => {
    const query = parseHotelQuery({ city: 'Delhi' });
    assert.equal(query.city, 'delhi');
    assert.equal(query.hasPriceFilter, false);
  });

  it('accepts minPrice only, maxPrice only, and both bounds', () => {
    assert.deepEqual(parseHotelQuery({ city: 'delhi', minPrice: '5000' }), {
      city: 'delhi',
      minPrice: 5000,
      maxPrice: undefined,
      hasPriceFilter: true,
    });
    assert.deepEqual(parseHotelQuery({ city: 'delhi', maxPrice: '6000' }), {
      city: 'delhi',
      minPrice: undefined,
      maxPrice: 6000,
      hasPriceFilter: true,
    });
    assert.equal(
      parseHotelQuery({ city: 'delhi', minPrice: '5000', maxPrice: '6000' }).hasPriceFilter,
      true,
    );
  });

  it('rejects a missing city, a negative price, a non-numeric price, and an inverted range', () => {
    assert.throws(
      () => parseHotelQuery({}),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, 'INVALID_CITY');
        return true;
      },
    );

    assert.throws(
      () => parseHotelQuery({ city: 'delhi', minPrice: '-1' }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'INVALID_PRICE');
        return true;
      },
    );

    assert.throws(
      () => parseHotelQuery({ city: 'delhi', maxPrice: 'cheap' }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'INVALID_PRICE');
        return true;
      },
    );

    assert.throws(
      () => parseHotelQuery({ city: 'delhi', minPrice: '8000', maxPrice: '1000' }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.code, 'INVALID_PRICE_RANGE');
        return true;
      },
    );
  });
});
