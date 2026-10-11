<script setup lang="ts">
import { computed } from 'vue';
import { useListFilter } from '@/composables/useListFilter';
import { lastOpenedProfileId } from '@/composables/useFocusOnNavigation';
import { detailRouteFor } from '@/navigation';
import type { LoadStatus } from '@/stores/randomProfiles';
import type { Profile, ProfileSource } from '@/types/profile';
import {
  countriesOf,
  filterProfiles,
  fullName,
  nextSort,
  sortProfiles,
  type SortKey,
} from '@/utils/profile';

const props = defineProps<{
  source: ProfileSource;
  profiles: Profile[];
  status: LoadStatus;
  error: string | null;
  emptyText: string;
  /** Marks rows that are already persisted (used on the random list). */
  isSaved?: (id: string) => boolean;
}>();

const emit = defineEmits<{ retry: [] }>();

const { query, country, sort, clear } = useListFilter();

const visible = computed(() =>
  sortProfiles(filterProfiles(props.profiles, { query: query.value, country: country.value }), sort.value),
);

const columns: { label: string; sortKey?: SortKey }[] = [
  { label: 'Name', sortKey: 'name' },
  { label: 'Gender', sortKey: 'gender' },
  { label: 'Country', sortKey: 'country' },
  { label: 'Phone' },
  { label: 'Email' },
];

function sortState(key: SortKey): 'ascending' | 'descending' | 'none' {
  if (sort.value?.key !== key) return 'none';
  return sort.value.dir === 'asc' ? 'ascending' : 'descending';
}

const SORT_ICON = { ascending: '↑', descending: '↓', none: '↕' } as const;
const SORT_TEXT = { ascending: ', sorted A to Z', descending: ', sorted Z to A', none: '' } as const;

const countries = computed(() => {
  const list = countriesOf(props.profiles);
  return country.value && !list.includes(country.value) ? [country.value, ...list] : list;
});

const hasFilter = computed(() => Boolean(query.value.trim() || country.value));
const showSkeleton = computed(() => props.status === 'loading' && props.profiles.length === 0);
const idPrefix = `dir-${props.source}`;
</script>

<template>
  <section class="directory card" :aria-busy="status === 'loading'">
    <form class="filters" role="search" @submit.prevent>
      <div class="field field-search">
        <label :for="`${idPrefix}-q`">Name</label>
        <span class="search">
          <svg class="search-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            :id="`${idPrefix}-q`"
            v-model="query"
            type="search"
            dir="auto"
            autocomplete="off"
            spellcheck="false"
            placeholder="Search first or last name"
          />
        </span>
      </div>
      <div class="field">
        <label :for="`${idPrefix}-country`">Country</label>
        <select :id="`${idPrefix}-country`" v-model="country">
          <option value="">All countries</option>
          <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      <button v-if="hasFilter" type="button" class="btn btn-quiet" @click="clear">Clear</button>
      <p class="count" aria-live="polite">
        <template v-if="status !== 'loading' && profiles.length">
          <strong>{{ visible.length }}</strong> of {{ profiles.length }}
        </template>
      </p>
    </form>

    <div v-if="status === 'error'" class="notice notice-error" role="alert">
      <p>{{ error }}</p>
      <button type="button" class="btn" @click="emit('retry')">Try again</button>
    </div>

    <div v-if="profiles.length > 0 || showSkeleton" class="table">
      <div class="row row-head" role="group" aria-label="Sort">
        <span aria-hidden="true"></span>
        <template v-for="col in columns" :key="col.label">
          <button
            v-if="col.sortKey"
            type="button"
            class="sort"
            :class="{ active: sortState(col.sortKey) !== 'none' }"
            :title="`Sort by ${col.label.toLowerCase()}`"
            :aria-label="`${col.label}${SORT_TEXT[sortState(col.sortKey)]}`"
            @click="sort = nextSort(sort, col.sortKey)"
          >
            {{ col.label }}
            <span class="sort-icon" aria-hidden="true">{{ SORT_ICON[sortState(col.sortKey)] }}</span>
          </button>
          <span v-else class="col-label" aria-hidden="true">{{ col.label }}</span>
        </template>
      </div>

      <div v-if="showSkeleton" aria-hidden="true">
        <div v-for="n in 10" :key="n" class="row row-skeleton">
          <span class="thumb"></span>
          <span class="bar" style="width: 70%"></span>
          <span class="bar" style="width: 50%"></span>
          <span class="bar" style="width: 60%"></span>
          <span class="bar" style="width: 80%"></span>
          <span class="bar" style="width: 90%"></span>
        </div>
      </div>

      <div v-else role="list" :aria-label="`${visible.length} people`">
        <div v-for="profile in visible" :key="profile.id" role="listitem">
          <RouterLink
            :to="detailRouteFor(source, profile.id)"
            class="row row-link"
            :data-restore-focus="profile.id === lastOpenedProfileId ? '' : undefined"
          >
            <img class="thumb" :src="profile.picture.thumbnail" alt="" width="40" height="40" loading="lazy" />
            <span class="name">
              <bdi>{{ fullName(profile.name) }}</bdi>
              <span v-if="isSaved?.(profile.id)" class="tag">Saved</span>
            </span>
            <span class="cell gender">{{ profile.gender }}</span>
            <span class="cell"><bdi>{{ profile.location.country }}</bdi></span>
            <span class="cell num" dir="ltr">{{ profile.phone }}</span>
            <span class="cell email" dir="ltr">{{ profile.email }}</span>
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-if="status === 'ready' && profiles.length === 0" class="notice">
      <p>{{ emptyText }}</p>
      <slot name="empty" />
    </div>
    <div v-else-if="profiles.length > 0 && visible.length === 0" class="notice">
      <p>Nobody matches this filter.</p>
      <button type="button" class="btn" @click="clear">Clear filter</button>
    </div>
  </section>
</template>

<style scoped>
.directory {
  overflow: hidden;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 0.75rem 1rem;
  padding: 1.25rem 1.25rem 1.1rem;
  border-block-end: 1px solid var(--line);
}

.field {
  display: grid;
  gap: 0.35rem;
}

.search {
  position: relative;
  display: block;
}

.search-icon {
  position: absolute;
  inset-inline-start: 0.75rem;
  inset-block-start: 50%;
  translate: 0 -50%;
  inline-size: 1rem;
  block-size: 1rem;
  fill: none;
  stroke: var(--muted);
  stroke-width: 2;
  stroke-linecap: round;
  pointer-events: none;
}

.search input {
  inline-size: 18rem;
  padding-inline-start: 2.25rem;
}

.field select {
  inline-size: 13rem;
}

.count {
  margin: 0 0 0.6rem;
  margin-inline-start: auto;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  font-size: 0.875rem;
}

.count strong {
  color: var(--ink);
  font-weight: 600;
}

.row {
  display: grid;
  grid-template-columns: 40px minmax(11rem, 1.3fr) 5.5rem minmax(7rem, 0.8fr) minmax(9rem, 0.9fr) minmax(12rem, 1.4fr);
  gap: 1rem;
  align-items: center;
  padding: 0.7rem 1.25rem;
  border-block-end: 1px solid var(--line);
}

[role='list'] > :last-child .row {
  border-block-end: 0;
}

.row-head {
  padding-block: 0.6rem;
  background: #fbfaf8;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--muted);
}

.sort {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  justify-self: start;
  margin-inline-start: -0.4rem;
  padding: 0.2rem 0.4rem;
  border: 0;
  border-radius: 6px;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

.sort:hover {
  background: var(--hover);
  color: var(--ink);
}

.sort.active {
  color: var(--accent-strong);
}

.sort-icon {
  font-size: 0.8rem;
  opacity: 0.4;
}

.sort.active .sort-icon {
  opacity: 1;
}

.row-link {
  color: inherit;
  text-decoration: none;
  transition: background-color 120ms ease;
}

.row-link:hover {
  background: var(--hover);
}

.row-link:focus-visible {
  box-shadow: inset 0 0 0 2px var(--accent);
  background: var(--hover);
}

.thumb {
  inline-size: 40px;
  block-size: 40px;
  border-radius: 50%;
  background: var(--hover);
  object-fit: cover;
}

.name {
  font-weight: 500;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.925rem;
}

.cell[dir='ltr'] {
  text-align: start;
}

.gender {
  text-transform: capitalize;
  color: var(--muted);
}

.email {
  color: var(--muted);
}

.tag {
  padding: 0.05rem 0.5rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 0.72rem;
  font-weight: 500;
}

.row-skeleton .bar,
.row-skeleton .thumb {
  display: block;
  block-size: 0.7rem;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--hover) 0%, #ebe8e2 50%, var(--hover) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite;
}

.row-skeleton .thumb {
  block-size: 40px;
  border-radius: 50%;
}

@keyframes shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}

.notice {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 2.5rem 1.25rem;
  color: var(--muted);
}

.notice p {
  margin: 0;
}

.notice-error {
  padding-block: 1rem;
  background: var(--danger-soft);
  color: var(--danger);
  border-block-end: 1px solid #f3d3cd;
}

@media (max-width: 860px) {
  .row-head {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
  }

  .row-head > :not(.sort) {
    display: none;
  }

  .row {
    grid-template-columns: 40px 1fr;
    gap: 0.1rem 0.9rem;
    padding-block: 0.85rem;
  }

  .row > :not(.thumb) {
    grid-column: 2;
  }

  .thumb {
    grid-row: span 5;
    align-self: start;
  }

  .field {
    flex: 1 1 12rem;
  }

  .search input,
  .field select {
    inline-size: 100%;
  }
}
</style>
