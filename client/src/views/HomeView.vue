<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useRandomProfilesStore } from '@/stores/randomProfiles';
import { useSavedProfilesStore } from '@/stores/savedProfiles';

const router = useRouter();
const random = useRandomProfilesStore();
const saved = useSavedProfilesStore();

onMounted(() => void saved.load());

function fetchNew() {
  void random.fetchBatch();
  void router.push({ name: 'random-list' });
}
</script>

<template>
  <main class="page home">
    <header class="intro">
      <h1 tabindex="-1">Meet ten new people.</h1>
      <p>Pull a fresh batch from randomuser.me, keep the ones you like, and edit them as you go.</p>
    </header>

    <div class="entries">
      <button type="button" class="entry card" @click="fetchNew">
        <span class="entry-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22" />
            <path d="m18 2 4 4-4 4" />
            <path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2" />
            <path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8" />
            <path d="m18 14 4 4-4 4" />
          </svg>
        </span>
        <span class="entry-text">
          <span class="entry-label">Fetch</span>
          <span class="entry-desc">10 random people from randomuser.me</span>
        </span>
        <span class="entry-arrow" aria-hidden="true">→</span>
      </button>

      <RouterLink class="entry card" :to="{ name: 'saved-list' }">
        <span class="entry-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
        </span>
        <span class="entry-text">
          <span class="entry-label">
            History
            <span v-if="saved.status === 'ready'" class="entry-count">{{ saved.profiles.length }}</span>
          </span>
          <span class="entry-desc">The people you've saved</span>
        </span>
        <span class="entry-arrow" aria-hidden="true">→</span>
      </RouterLink>
    </div>

    <p v-if="random.profiles.length" class="resume">
      You have {{ random.profiles.length }} people from your last fetch.
      <RouterLink :to="{ name: 'random-list' }">Continue with them</RouterLink>
      (Fetch replaces them, including unsaved name edits.)
    </p>
  </main>
</template>

<style scoped>
.home {
  padding-block-start: clamp(2.5rem, 8vw, 5rem);
}

.intro {
  max-inline-size: 34rem;
  margin-block-end: 2.5rem;
}

.intro h1 {
  font-size: clamp(2.1rem, 5vw, 3rem);
}

.intro p {
  margin: 0.85rem 0 0;
  font-size: 1.1rem;
  color: var(--muted);
}

.entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
  gap: 1rem;
}

.entry {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.1rem;
  padding: 1.5rem;
  color: var(--ink);
  text-align: start;
  text-decoration: none;
  font: inherit;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.entry:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow:
    0 1px 2px rgb(29 36 34 / 0.04),
    0 18px 40px -18px rgb(29 36 34 / 0.28);
}

.entry:focus-visible {
  box-shadow: var(--ring), var(--shadow-md);
}

.entry-icon {
  display: grid;
  place-items: center;
  inline-size: 3rem;
  block-size: 3rem;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent);
}

.entry-icon svg {
  inline-size: 1.4rem;
  block-size: 1.4rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.entry-text {
  display: grid;
  gap: 0.15rem;
}

.entry-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.entry-count {
  padding: 0 0.5rem;
  border-radius: 999px;
  background: var(--hover);
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.5rem;
}

.entry-desc {
  color: var(--muted);
  font-size: 0.95rem;
}

.entry-arrow {
  font-size: 1.3rem;
  color: var(--muted);
  transition:
    transform 160ms ease,
    color 160ms ease;
}

.entry:hover .entry-arrow {
  transform: translateX(3px);
  color: var(--accent);
}

.resume {
  margin-block-start: 1.5rem;
  color: var(--muted);
  font-size: 0.925rem;
}
</style>
