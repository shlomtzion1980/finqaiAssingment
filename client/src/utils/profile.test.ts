import { describe, expect, it } from 'vitest';
import type { Profile } from '@/types/profile';
import {
  ageOn,
  birthYear,
  filterProfiles,
  nextSort,
  parseSort,
  serializeSort,
  sortProfiles,
} from './profile';

const make = (first: string, last: string, country: string, title = 'Mr'): Profile => ({
  id: `${first}-${last}`,
  name: { title, first, last },
  gender: 'male',
  email: 'x@example.com',
  phone: '1',
  dob: '1990-01-01T00:30:00.000Z',
  location: { street: { number: 1, name: 'A' }, city: 'C', state: 'S', country },
  picture: { large: '', thumbnail: '' },
});

const people = [
  make('John', 'Smith', 'Germany'),
  make('Zoé', 'Çelik', 'Turkey'),
  make('Mia', 'Johnson', 'Germany', 'Ms'),
  make('آرمین', 'رضایی', 'Iran'),
];

const ids = (list: Profile[]) => list.map((p) => p.name.first);

describe('filterProfiles', () => {
  it('returns everything for an empty filter', () => {
    expect(filterProfiles(people, { query: '  ', country: '' })).toHaveLength(4);
  });

  it('matches every token, in any order, across first and last name', () => {
    expect(ids(filterProfiles(people, { query: 'sm jo', country: '' }))).toEqual(['John']);
    expect(ids(filterProfiles(people, { query: 'john', country: '' }))).toEqual(['John', 'Mia']);
  });

  it('ignores case and diacritics', () => {
    expect(ids(filterProfiles(people, { query: 'ZOE CEL', country: '' }))).toEqual(['Zoé']);
  });

  it('does not match on title', () => {
    expect(filterProfiles(people, { query: 'mr', country: '' })).toHaveLength(0);
  });

  it('matches non-Latin names', () => {
    expect(ids(filterProfiles(people, { query: 'رضا', country: '' }))).toEqual(['آرمین']);
  });

  it('combines name and country', () => {
    expect(ids(filterProfiles(people, { query: 'john', country: 'Germany' }))).toEqual(['John', 'Mia']);
    expect(filterProfiles(people, { query: 'zoe', country: 'Germany' })).toHaveLength(0);
  });
});

describe('sorting', () => {
  it('sorts by country, breaking ties by name, and reverses for descending', () => {
    const sorted = sortProfiles(people, { key: 'country', dir: 'asc' });
    expect(sorted.map((p) => p.location.country)).toEqual(['Germany', 'Germany', 'Iran', 'Turkey']);
    expect(ids(sorted.slice(0, 2))).toEqual(['John', 'Mia']);
    expect(sortProfiles(people, { key: 'country', dir: 'desc' })[0]?.location.country).toBe('Turkey');
  });

  it('leaves the original order when unsorted and does not mutate the input', () => {
    const before = ids(people);
    expect(sortProfiles(people, null)).toBe(people);
    sortProfiles(people, { key: 'name', dir: 'desc' });
    expect(ids(people)).toEqual(before);
  });

  it('cycles ascending, descending, off, and round-trips through the URL', () => {
    const asc = nextSort(null, 'country');
    const desc = nextSort(asc, 'country');
    expect(asc).toEqual({ key: 'country', dir: 'asc' });
    expect(desc).toEqual({ key: 'country', dir: 'desc' });
    expect(nextSort(desc, 'country')).toBeNull();
    expect(nextSort(desc, 'name')).toEqual({ key: 'name', dir: 'asc' });
    expect(parseSort(serializeSort(desc))).toEqual(desc);
    expect(parseSort('-bogus')).toBeNull();
  });
});

describe('dates', () => {
  it('uses UTC so the birth year does not shift with the viewer timezone', () => {
    expect(birthYear('1990-01-01T00:30:00.000Z')).toBe(1990);
  });

  it('counts age by whether the birthday has passed', () => {
    const dob = '1990-06-15T10:00:00.000Z';
    expect(ageOn(dob, new Date('2026-06-14T12:00:00Z'))).toBe(35);
    expect(ageOn(dob, new Date('2026-06-15T12:00:00Z'))).toBe(36);
  });
});
