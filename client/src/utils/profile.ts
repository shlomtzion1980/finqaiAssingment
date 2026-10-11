import type { Profile, ProfileName } from '@/types/profile';

export function fullName(name: ProfileName): string {
  return [name.title, name.first, name.last].filter(Boolean).join(' ');
}

/** Lowercase and strip diacritics, so "zoe" finds "Zoé" and "celik" finds "Çelik". */
export function normalizeForSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

export type ProfileFilter = { query: string; country: string };

/**
 * Every whitespace-separated token of the query must appear in the first/last name,
 * so "jo sm" matches "John Smith". Title is excluded: searching "m" shouldn't match every "Mr".
 */
export function filterProfiles<T extends Profile>(profiles: T[], filter: ProfileFilter): T[] {
  const tokens = normalizeForSearch(filter.query).split(/\s+/).filter(Boolean);
  return profiles.filter((profile) => {
    if (filter.country && profile.location.country !== filter.country) return false;
    if (tokens.length === 0) return true;
    const haystack = normalizeForSearch(`${profile.name.first} ${profile.name.last}`);
    return tokens.every((token) => haystack.includes(token));
  });
}

export type SortKey = 'name' | 'gender' | 'country';
export type Sort = { key: SortKey; dir: 'asc' | 'desc' } | null;

const SORT_KEYS: readonly SortKey[] = ['name', 'gender', 'country'];
const collator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });
const sortValue: Record<SortKey, (p: Profile) => string> = {
  name: (p) => `${p.name.first} ${p.name.last}`,
  gender: (p) => p.gender,
  country: (p) => p.location.country,
};

/** Stable, locale-aware sort; ties fall back to name so equal countries stay alphabetical. */
export function sortProfiles<T extends Profile>(profiles: T[], sort: Sort): T[] {
  if (!sort) return profiles;
  const direction = sort.dir === 'asc' ? 1 : -1;
  const value = sortValue[sort.key];
  return [...profiles].sort(
    (a, b) =>
      direction * collator.compare(value(a), value(b)) ||
      collator.compare(sortValue.name(a), sortValue.name(b)),
  );
}

/** Header clicks cycle: ascending → descending → original order. */
export function nextSort(current: Sort, key: SortKey): Sort {
  if (current?.key !== key) return { key, dir: 'asc' };
  return current.dir === 'asc' ? { key, dir: 'desc' } : null;
}

/** URL form: "country" for ascending, "-country" for descending. */
export function parseSort(raw: string): Sort {
  const dir = raw.startsWith('-') ? 'desc' : 'asc';
  const key = raw.replace(/^-/, '') as SortKey;
  return SORT_KEYS.includes(key) ? { key, dir } : null;
}

export function serializeSort(sort: Sort): string {
  if (!sort) return '';
  return sort.dir === 'desc' ? `-${sort.key}` : sort.key;
}

export function countriesOf(profiles: Profile[]): string[] {
  return [...new Set(profiles.map((p) => p.location.country))].sort((a, b) => a.localeCompare(b));
}

/** Computed in UTC: dob values like 1990-01-01T00:30Z would otherwise shift to 1989 west of UTC. */
export function birthYear(dobIso: string): number {
  return new Date(dobIso).getUTCFullYear();
}

export function ageOn(dobIso: string, today: Date = new Date()): number {
  const dob = new Date(dobIso);
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < dob.getUTCMonth() ||
    (today.getUTCMonth() === dob.getUTCMonth() && today.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function sameName(a: ProfileName, b: ProfileName): boolean {
  return a.title === b.title && a.first === b.first && a.last === b.last;
}

export function trimName(name: ProfileName): ProfileName {
  return { title: name.title.trim(), first: name.first.trim(), last: name.last.trim() };
}
