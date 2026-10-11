<script setup lang="ts">
import { onMounted } from 'vue';
import ProfileDirectory from '@/components/ProfileDirectory.vue';
import { useRandomProfilesStore } from '@/stores/randomProfiles';
import { useSavedProfilesStore } from '@/stores/savedProfiles';

const random = useRandomProfilesStore();
const saved = useSavedProfilesStore();

onMounted(() => {
  // Direct visit to /fetch with no batch yet. Coming Back from a profile must not refetch.
  if (random.status === 'idle') void random.fetchBatch();
  void saved.load();
});
</script>

<template>
  <main class="page">
    <header class="page-head">
      <div>
        <p class="eyebrow">randomuser.me</p>
        <h1 tabindex="-1">Random people</h1>
      </div>
      <button
        type="button"
        class="btn"
        :disabled="random.status === 'loading'"
        @click="random.fetchBatch()"
      >
        {{ random.status === 'loading' ? 'Fetching…' : 'Fetch another 10' }}
      </button>
    </header>

    <ProfileDirectory
      source="random"
      :profiles="random.profiles"
      :status="random.status"
      :error="random.error"
      :is-saved="saved.isSaved"
      empty-text="randomuser.me returned nobody."
      @retry="random.fetchBatch()"
    />
  </main>
</template>
