export function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

/** Stable Redis member for a deduplicated hotel. Names are already unique after comparison. */
export function hotelMemberKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
