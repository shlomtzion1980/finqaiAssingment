import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { parseSort, serializeSort, type Sort } from '@/utils/profile';

const asString = (value: unknown) => (typeof value === 'string' ? value : '');

/**
 * Filter and sort state live in the URL (?q=&country=&sort=), so they survive Back from
 * the detail screen and a reload, and each list keeps its own. Local refs keep the input
 * responsive; the URL is updated with replace() so typing doesn't add history entries.
 */
export function useListFilter() {
  const route = useRoute();
  const router = useRouter();

  const query = ref(asString(route.query.q));
  const country = ref(asString(route.query.country));
  const sortParam = ref(asString(route.query.sort));

  const sort = computed<Sort>({
    get: () => parseSort(sortParam.value),
    set: (value) => {
      sortParam.value = serializeSort(value);
    },
  });

  watch([query, country, sortParam], ([q, c, s]) => {
    const current = route.query;
    if (asString(current.q) === q && asString(current.country) === c && asString(current.sort) === s) {
      return;
    }
    void router.replace({
      query: { ...current, q: q || undefined, country: c || undefined, sort: s || undefined },
    });
  });

  watch(
    () => [route.query.q, route.query.country, route.query.sort],
    ([q, c, s]) => {
      query.value = asString(q);
      country.value = asString(c);
      sortParam.value = asString(s);
    },
  );

  function clear() {
    query.value = '';
    country.value = '';
  }

  return { query, country, sort, clear };
}
