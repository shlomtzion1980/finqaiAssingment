import type { Profile, ProfileName, SavedProfile } from '@/types/profile';
import { requestJson } from './http';

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? '/api'}/profiles`;
const url = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export const profilesApi = {
  list: (signal?: AbortSignal) => requestJson<SavedProfile[]>(BASE, { signal }),
  get: (id: string, signal?: AbortSignal) => requestJson<SavedProfile>(url(id), { signal }),
  save: (profile: Profile) => requestJson<SavedProfile>(BASE, { method: 'POST', body: profile }),
  rename: (id: string, name: ProfileName) =>
    requestJson<SavedProfile>(url(id), { method: 'PATCH', body: { name } }),
  remove: (id: string) => requestJson<void>(url(id), { method: 'DELETE' }),
};
