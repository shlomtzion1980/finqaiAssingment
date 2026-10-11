import { nextTick, ref } from 'vue';
import type { Router } from 'vue-router';

/** Id of the last profile opened, so the list can hand focus back to its row. */
export const lastOpenedProfileId = ref<string | null>(null);

/**
 * SPA navigations don't move focus, so keyboard and screen-reader users are left on a
 * link that no longer exists. After each navigation, focus the element marked with
 * [data-restore-focus] (the row you came from) or else the page's <h1>.
 */
export function installFocusOnNavigation(router: Router): void {
  router.afterEach((to, from, failure) => {
    if (failure || from.matched.length === 0) return; // initial load: leave focus alone
    if (to.path === from.path) return; // query-only change, e.g. typing in a filter
    void nextTick(() => {
      const target =
        document.querySelector<HTMLElement>('[data-restore-focus]') ??
        document.querySelector<HTMLElement>('main h1');
      if (!target) return;
      target.focus({ preventScroll: true });
      if (target.hasAttribute('data-restore-focus')) target.scrollIntoView({ block: 'nearest' });
    });
  });
}
