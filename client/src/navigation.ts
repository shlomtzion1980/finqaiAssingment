import type { ProfileSource } from '@/types/profile';

export function listRouteFor(source: ProfileSource) {
  return { name: source === 'random' ? 'random-list' : 'saved-list' } as const;
}

export function detailRouteFor(source: ProfileSource, id: string) {
  return { name: source === 'random' ? 'random-detail' : 'saved-detail', params: { id } } as const;
}
