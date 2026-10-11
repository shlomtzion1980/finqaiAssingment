import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { fetchRandomProfiles } from '@/api/randomUser';
import { errorMessage, isAbortError } from '@/api/http';
import type { Profile, ProfileName } from '@/types/profile';

const BATCH_SIZE = 10;
const STORAGE_KEY = 'random-profiles:v1';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * The current randomuser batch, kept in sessionStorage. Without that, a refresh or
 * opening a profile in a new tab would lose the batch and any unsaved name edits,
 * because randomuser can't return the same people twice.
 */
export const useRandomProfilesStore = defineStore('randomProfiles', () => {
  const profiles = ref<Profile[]>(readStorage());
  const status = ref<LoadStatus>(profiles.value.length ? 'ready' : 'idle');
  const error = ref<string | null>(null);
  let inFlight: AbortController | null = null;

  const byId = computed(() => new Map(profiles.value.map((p) => [p.id, p])));

  async function fetchBatch(): Promise<void> {
    inFlight?.abort();
    const controller = new AbortController();
    inFlight = controller;
    status.value = 'loading';
    error.value = null;
    try {
      profiles.value = await fetchRandomProfiles(BATCH_SIZE, controller.signal);
      status.value = 'ready';
    } catch (err) {
      if (isAbortError(err)) return;
      error.value = errorMessage(err);
      status.value = 'error';
    } finally {
      if (inFlight === controller) inFlight = null;
    }
  }

  function find(id: string): Profile | undefined {
    return byId.value.get(id);
  }

  function rename(id: string, name: ProfileName): void {
    const profile = byId.value.get(id);
    if (profile) profile.name = { ...name };
  }

  watch(profiles, (value) => writeStorage(value), { deep: true });

  return { profiles, status, error, fetchBatch, find, rename };
});

function readStorage(): Profile[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Profile[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(profiles: Profile[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Storage full or disabled (private mode): the batch just won't survive a reload.
  }
}
