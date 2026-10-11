import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { profilesApi } from '@/api/profiles';
import { ApiError, errorMessage } from '@/api/http';
import type { Profile, ProfileName, SavedProfile } from '@/types/profile';
import type { LoadStatus } from './randomProfiles';

/** Client-side mirror of what the backend has persisted. The backend is the source of truth. */
export const useSavedProfilesStore = defineStore('savedProfiles', () => {
  const profiles = ref<SavedProfile[]>([]);
  const status = ref<LoadStatus>('idle');
  const error = ref<string | null>(null);
  let pendingLoad: Promise<void> | null = null;

  const byId = computed(() => new Map(profiles.value.map((p) => [p.id, p])));

  /** Loads the list once; concurrent callers share the same request. Pass force to refetch. */
  function load(force = false): Promise<void> {
    if (pendingLoad) return pendingLoad;
    if (status.value === 'ready' && !force) return Promise.resolve();

    status.value = 'loading';
    error.value = null;
    pendingLoad = profilesApi
      .list()
      .then((list) => {
        profiles.value = list;
        status.value = 'ready';
      })
      .catch((err: unknown) => {
        error.value = errorMessage(err);
        status.value = 'error';
      })
      .finally(() => {
        pendingLoad = null;
      });
    return pendingLoad;
  }

  function find(id: string): SavedProfile | undefined {
    return byId.value.get(id);
  }

  function isSaved(id: string): boolean {
    return byId.value.has(id);
  }

  function upsertLocal(profile: SavedProfile): void {
    const index = profiles.value.findIndex((p) => p.id === profile.id);
    if (index === -1) profiles.value.unshift(profile);
    else profiles.value[index] = profile;
  }

  /** Fetches a single profile (e.g. on a deep link to /history/:id). Returns undefined on 404. */
  async function fetchOne(id: string): Promise<SavedProfile | undefined> {
    try {
      const profile = await profilesApi.get(id);
      upsertLocal(profile);
      return profile;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }

  async function save(profile: Profile): Promise<SavedProfile> {
    try {
      const saved = await profilesApi.save(profile);
      upsertLocal(saved);
      return saved;
    } catch (err) {
      // Saved from another tab: adopt the server's copy instead of failing.
      if (err instanceof ApiError && err.status === 409) {
        const existing = await profilesApi.get(profile.id);
        upsertLocal(existing);
        return existing;
      }
      throw err;
    }
  }

  async function rename(id: string, name: ProfileName): Promise<SavedProfile> {
    const updated = await profilesApi.rename(id, name);
    upsertLocal(updated);
    return updated;
  }

  async function remove(id: string): Promise<void> {
    try {
      await profilesApi.remove(id);
    } catch (err) {
      // Already gone on the server: still drop it locally.
      if (!(err instanceof ApiError && err.status === 404)) throw err;
    }
    profiles.value = profiles.value.filter((p) => p.id !== id);
  }

  return { profiles, status, error, load, find, isSaved, fetchOne, save, rename, remove };
});
