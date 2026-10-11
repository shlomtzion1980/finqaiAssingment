<script setup lang="ts">
import { useSavedProfilesStore } from '@/stores/savedProfiles';

const saved = useSavedProfilesStore();
</script>

<template>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="masthead">
    <div class="masthead-inner">
      <RouterLink class="brand" :to="{ name: 'home' }">
        <svg class="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="9" />
          <circle cx="16" cy="12.5" r="4.5" fill="#fff" />
          <path d="M8 25c1.2-4.2 4.4-6.5 8-6.5s6.8 2.3 8 6.5" fill="#fff" />
        </svg>
        Anashim
      </RouterLink>
      <nav aria-label="Main">
        <RouterLink :to="{ name: 'random-list' }">Fetch</RouterLink>
        <RouterLink :to="{ name: 'saved-list' }">
          History<span v-if="saved.status === 'ready'" class="nav-count">{{ saved.profiles.length }}</span>
        </RouterLink>
      </nav>
    </div>
  </header>
  <div id="content" class="content">
    <RouterView />
  </div>
</template>

<style scoped>
.masthead {
  position: sticky;
  inset-block-start: 0;
  z-index: 5;
  background: rgb(247 245 241 / 0.85);
  backdrop-filter: saturate(1.4) blur(10px);
  border-block-end: 1px solid var(--line);
}

.masthead-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  max-inline-size: var(--page-width);
  margin-inline: auto;
  padding: 0.75rem 1.5rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: -0.01em;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
  border-radius: var(--radius);
}

.brand-mark {
  inline-size: 1.75rem;
  block-size: 1.75rem;
  fill: var(--accent);
}

nav {
  display: flex;
  gap: 0.25rem;
}

nav a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.925rem;
  font-weight: 500;
  text-decoration: none;
  transition:
    background-color 120ms ease,
    color 120ms ease;
}

nav a:hover {
  background: var(--hover);
  color: var(--ink);
}

nav a.router-link-active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.nav-count {
  min-inline-size: 1.4rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--ink);
  font-size: 0.75rem;
  line-height: 1.3rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.content {
  max-inline-size: var(--page-width);
  margin-inline: auto;
  padding-inline: 1.5rem;
  padding-block-end: 4rem;
}

@media (max-width: 760px) {
  .content {
    padding-inline: 0.75rem;
  }
}
</style>
