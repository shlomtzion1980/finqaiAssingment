<script setup lang="ts">
import { onMounted } from 'vue';
import ProfileDirectory from '@/components/ProfileDirectory.vue';
import { useSavedProfilesStore } from '@/stores/savedProfiles';

const saved = useSavedProfilesStore();

// Always revalidate: the list may have changed in another tab since it was cached.
onMounted(() => void saved.load(true));
</script>

<template>
  <main class="page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Stored on the server</p>
        <h1 tabindex="-1">Saved profiles</h1>
      </div>
    </header>

    <ProfileDirectory
      source="saved"
      :profiles="saved.profiles"
      :status="saved.status"
      :error="saved.error"
      empty-text="Nothing saved yet."
      @retry="saved.load(true)"
    >
      <template #empty>
        <RouterLink class="btn" :to="{ name: 'random-list' }">Browse random people</RouterLink>
      </template>
    </ProfileDirectory>
  </main>
</template>
