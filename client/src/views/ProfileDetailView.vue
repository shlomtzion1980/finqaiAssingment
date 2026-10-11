<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import { errorMessage } from '@/api/http';
import { lastOpenedProfileId } from '@/composables/useFocusOnNavigation';
import { listRouteFor } from '@/navigation';
import { useRandomProfilesStore } from '@/stores/randomProfiles';
import { useSavedProfilesStore } from '@/stores/savedProfiles';
import type { ProfileName, ProfileSource } from '@/types/profile';
import { ageOn, birthYear, fullName, sameName, trimName } from '@/utils/profile';

const props = defineProps<{ id: string; source: ProfileSource }>();

const router = useRouter();
const random = useRandomProfilesStore();
const saved = useSavedProfilesStore();

const GENDER_HE: Record<string, string> = { male: 'זכר', female: 'נקבה' };

const lookup = ref<'loading' | 'done' | 'error'>('loading');
const lookupError = ref<string | null>(null);

watch(
  () => props.id,
  async (id) => {
    lastOpenedProfileId.value = id;
    lookup.value = 'loading';
    lookupError.value = null;
    try {
      // The saved list tells us whether a profile from the random batch is already in the DB.
      await saved.load();
      if (props.source === 'saved' && !saved.find(id)) await saved.fetchOne(id);
      lookup.value = 'done';
    } catch (err) {
      lookupError.value = errorMessage(err);
      lookup.value = 'error';
    }
  },
  { immediate: true },
);

const savedProfile = computed(() => saved.find(props.id));
const randomProfile = computed(() => (props.source === 'random' ? random.find(props.id) : undefined));
/** Whether the profile is in the DB, not where we navigated from, decides Save vs Delete. */
const isSaved = computed(() => savedProfile.value !== undefined);
const profile = computed(() => savedProfile.value ?? randomProfile.value);

const draft = reactive<ProfileName>({ title: '', first: '', last: '' });
watch(
  () => profile.value?.name,
  (name) => {
    if (name) Object.assign(draft, name);
  },
  { immediate: true },
);

const draftName = computed(() => trimName(draft));
const isDirty = computed(() => !!profile.value && !sameName(draftName.value, profile.value.name));
const nameError = computed(() =>
  !draftName.value.first || !draftName.value.last ? 'שם פרטי ושם משפחה הם שדות חובה' : null,
);

type Action = 'save' | 'update' | 'delete';
const busy = ref<Action | null>(null);
const confirmingDelete = ref(false);
const flash = ref<{ kind: 'ok' | 'error'; text: string } | null>(null);

async function run(action: Action, task: () => Promise<string>) {
  busy.value = action;
  flash.value = null;
  try {
    flash.value = { kind: 'ok', text: await task() };
  } catch (err) {
    flash.value = { kind: 'error', text: `הפעולה נכשלה: ${errorMessage(err)}` };
  } finally {
    busy.value = null;
  }
}

function onSave() {
  const current = profile.value;
  if (!current || nameError.value) return;
  const name = draftName.value;
  return run('save', async () => {
    await saved.save({ ...current, name });
    random.rename(current.id, name);
    return 'הפרופיל נשמר במאגר';
  });
}

function onUpdate() {
  const current = profile.value;
  if (!current || nameError.value || !isDirty.value) return;
  const name = draftName.value;
  return run('update', async () => {
    if (isSaved.value) {
      await saved.rename(current.id, name);
      random.rename(current.id, name);
      return 'השם עודכן במאגר';
    }
    random.rename(current.id, name);
    return 'השם עודכן ברשימה הנוכחית בלבד. לחצו "שמירה" כדי לשמור אותו במאגר.';
  });
}

function onDelete() {
  const current = profile.value;
  if (!current) return;
  confirmingDelete.value = false;
  return run('delete', async () => {
    await saved.remove(current.id);
    if (props.source === 'saved') {
      skipLeaveGuard = true;
      goBack();
    }
    return 'הפרופיל נמחק מהמאגר';
  });
}

let skipLeaveGuard = false;

function goBack() {
  // Prefer real history so the list restores its scroll position and filter.
  if (window.history.state?.back) router.back();
  else void router.push(listRouteFor(props.source));
}

onBeforeRouteLeave(() => {
  if (skipLeaveGuard || !isDirty.value) return true;
  return window.confirm('יש שינויים בשם שלא עודכנו. לצאת בלי לעדכן?');
});

const sourceLabel = computed(() =>
  isSaved.value ? 'שמור במאגר' : 'מהרשימה האקראית · לא שמור',
);
</script>

<template>
  <main class="page" dir="rtl" lang="he">
    <p v-if="lookup === 'loading' && !profile" class="state" role="status">טוען…</p>

    <div v-else-if="!profile" class="state">
      <h1 tabindex="-1">הפרופיל לא נמצא</h1>
      <p v-if="lookupError" role="alert">
        לא ניתן היה לטעון את הפרופיל: <bdi>{{ lookupError }}</bdi>
      </p>
      <p v-else-if="source === 'random'">
        ייתכן שנטענה רשימה אקראית חדשה מאז.
      </p>
      <button type="button" class="btn" @click="goBack">
        <span class="arrow" aria-hidden="true">→</span><span>חזרה לרשימה</span>
      </button>
    </div>

    <article v-else class="profile card">
      <figure class="portrait">
        <img :src="profile.picture.large" :alt="`תמונה של ${profile.name.first} ${profile.name.last}`" width="256" height="256" />
      </figure>

      <div class="profile-main">
        <header class="profile-head">
          <p class="status" :class="{ saved: isSaved }">
            <span class="status-dot" aria-hidden="true"></span>
            {{ sourceLabel }}
          </p>
          <h1 tabindex="-1"><bdi>{{ fullName(profile.name) }}</bdi></h1>
        </header>

        <form class="sheet" novalidate @submit.prevent="onUpdate">
          <fieldset class="name-fieldset" aria-describedby="name-hint name-error">
            <legend>שם</legend>
            <div class="name-grid">
              <label class="input-group title-input">
                <span>תואר</span>
                <input v-model="draft.title" dir="auto" autocomplete="off" spellcheck="false" maxlength="20" />
              </label>
              <label class="input-group">
                <span>שם פרטי</span>
                <input
                  v-model="draft.first"
                  dir="auto"
                  autocomplete="off"
                  spellcheck="false"
                  maxlength="100"
                  required
                  :aria-invalid="!draftName.first"
                />
              </label>
              <label class="input-group">
                <span>שם משפחה</span>
                <input
                  v-model="draft.last"
                  dir="auto"
                  autocomplete="off"
                  spellcheck="false"
                  maxlength="100"
                  required
                  :aria-invalid="!draftName.last"
                />
              </label>
            </div>
            <p id="name-hint" class="hint">
              {{ isSaved ? 'עדכון יישמר במאגר.' : 'הפרופיל אינו שמור — עדכון ישנה רק את הרשימה הנוכחית, עד שתלחצו "שמירה".' }}
            </p>
            <p v-if="nameError" id="name-error" class="field-error">{{ nameError }}</p>
          </fieldset>

          <dl class="facts">
            <div>
              <dt>מגדר</dt>
              <dd>{{ GENDER_HE[profile.gender] ?? profile.gender }}</dd>
            </div>
            <div>
              <dt>גיל</dt>
              <dd>
                {{ ageOn(profile.dob) }}
                <span class="muted">(שנת לידה {{ birthYear(profile.dob) }})</span>
              </dd>
            </div>
            <div>
              <dt>כתובת</dt>
              <dd>
                <bdi>{{ profile.location.street.number }} {{ profile.location.street.name }}</bdi><br />
                <bdi>{{ [profile.location.city, profile.location.state].filter(Boolean).join(', ') }}</bdi>
              </dd>
            </div>
            <div>
              <dt>דוא״ל</dt>
              <dd><a dir="ltr" :href="`mailto:${profile.email}`">{{ profile.email }}</a></dd>
            </div>
            <div>
              <dt>טלפון</dt>
              <dd><a class="num" dir="ltr" :href="`tel:${profile.phone}`">{{ profile.phone }}</a></dd>
            </div>
          </dl>

          <div class="actions">
            <button
              type="submit"
              class="btn"
              :class="{ 'btn-primary': isSaved }"
              :disabled="!isDirty || !!nameError || busy !== null"
            >
              {{ busy === 'update' ? 'מעדכן…' : 'עדכון' }}
            </button>

            <button
              v-if="!isSaved"
              type="button"
              class="btn btn-primary"
              :disabled="!!nameError || busy !== null || lookup === 'loading'"
              @click="onSave"
            >
              {{ busy === 'save' ? 'שומר…' : 'שמירה' }}
            </button>

            <template v-else>
              <button
                v-if="!confirmingDelete"
                type="button"
                class="btn btn-danger"
                :disabled="busy !== null"
                @click="confirmingDelete = true"
              >
                {{ busy === 'delete' ? 'מוחק…' : 'מחיקה' }}
              </button>
              <span v-else class="confirm" role="group" aria-label="אישור מחיקה">
                <span>למחוק מהמאגר?</span>
                <button type="button" class="btn btn-danger" @click="onDelete">כן, למחוק</button>
                <button type="button" class="btn btn-quiet" @click="confirmingDelete = false">ביטול</button>
              </span>
            </template>

            <button type="button" class="btn btn-quiet back" @click="goBack">
              <span class="arrow" aria-hidden="true">→</span><span>חזרה</span>
            </button>
          </div>

          <p
            class="flash"
            :class="flash?.kind"
            :role="flash?.kind === 'error' ? 'alert' : 'status'"
          >
            <bdi v-if="flash">{{ flash.text }}</bdi>
          </p>
        </form>
      </div>
    </article>
  </main>
</template>

<style scoped>
.state {
  display: grid;
  gap: 1rem;
  justify-items: start;
  padding-block: 3rem;
}

.profile {
  display: grid;
  grid-template-columns: 15rem minmax(0, 1fr);
  gap: 2.5rem;
  padding: 2rem;
  min-inline-size: 0;
}

.portrait {
  margin: 0;
}

.portrait img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 1;
  border-radius: 14px;
  background: var(--hover);
  object-fit: cover;
}

.profile-main {
  display: grid;
  gap: 1.75rem;
  align-content: start;
  max-inline-size: 44rem;
  min-inline-size: 0;
}

.profile-head {
  display: grid;
  gap: 0.6rem;
  justify-items: start;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: var(--hover);
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 500;
}

.status.saved {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.status-dot {
  inline-size: 0.5rem;
  block-size: 0.5rem;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.6;
}

.status.saved .status-dot {
  opacity: 1;
}

.sheet {
  display: grid;
  gap: 1.75rem;
  min-inline-size: 0;
}

.name-fieldset {
  border: 0;
  padding: 0;
  margin: 0;
}

.name-fieldset legend {
  padding: 0;
  margin-block-end: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
}

.name-grid {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
  min-inline-size: 0;
}

.input-group {
  display: grid;
  gap: 0.35rem;
  min-inline-size: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--muted);
}

.input-group input {
  inline-size: 100%;
  min-inline-size: 0;
  max-inline-size: 100%;
  font-size: 1rem;
  font-weight: 400;
  /* Each input aligns to its own content direction: Latin left, Hebrew/Persian right. */
  text-align: start;
}

.hint,
.field-error {
  margin: 0.6rem 0 0;
  font-size: 0.825rem;
  color: var(--muted);
}

.field-error {
  color: var(--danger);
}

.facts {
  margin: 0;
  display: grid;
  border-block-start: 1px solid var(--line);
}

.facts > div {
  display: grid;
  grid-template-columns: 7rem minmax(0, 1fr);
  gap: 1rem;
  padding-block: 0.8rem;
  border-block-end: 1px solid var(--line);
}

.facts dt {
  color: var(--muted);
  font-size: 0.875rem;
}

.facts dd {
  margin: 0;
  min-inline-size: 0;
  overflow-wrap: anywhere;
}

.facts a {
  color: var(--ink);
  text-decoration-color: var(--line-strong);
}

.facts a:hover {
  color: var(--accent);
  text-decoration-color: currentColor;
}

.muted {
  color: var(--muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
}

.back {
  margin-inline-start: auto;
}

.confirm {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.4rem;
  padding-inline-start: 0.85rem;
  border-radius: var(--radius);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.9rem;
}

.flash {
  min-block-size: 1.5em;
  margin: -0.75rem 0 0;
  font-size: 0.9rem;
}

.flash.ok {
  color: var(--ok);
}

.flash.error {
  color: var(--danger);
}

@media (max-width: 760px) {
  .profile {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
    padding: 1.25rem 1rem;
  }

  .portrait {
    max-inline-size: 8.5rem;
    justify-self: center;
  }

  .profile-head {
    justify-items: center;
    text-align: center;
  }

  .profile-head h1 {
    overflow-wrap: anywhere;
  }

  .name-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .facts > div {
    grid-template-columns: 4.5rem minmax(0, 1fr);
    gap: 0.6rem;
  }

  .actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .back,
  .confirm {
    grid-column: 1 / -1;
    margin-inline-start: 0;
  }
}
</style>

