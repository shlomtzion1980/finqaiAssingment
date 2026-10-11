import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import RandomListView from '@/views/RandomListView.vue';
import SavedListView from '@/views/SavedListView.vue';
import ProfileDetailView from '@/views/ProfileDetailView.vue';
import NotFoundView from '@/views/NotFoundView.vue';
import type { ProfileSource } from '@/types/profile';

const detailProps = (source: ProfileSource) => (route: RouteLocationNormalized) => ({
  id: String(route.params.id),
  source,
});

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { title: 'Home' } },
    { path: '/fetch', name: 'random-list', component: RandomListView, meta: { title: 'Random people' } },
    { path: '/fetch/:id', name: 'random-detail', component: ProfileDetailView, props: detailProps('random'), meta: { title: 'Profile' } },
    { path: '/history', name: 'saved-list', component: SavedListView, meta: { title: 'Saved profiles' } },
    { path: '/history/:id', name: 'saved-detail', component: ProfileDetailView, props: detailProps('saved'), meta: { title: 'Profile' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView, meta: { title: 'Not found' } },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 };
  },
});

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '';
  document.title = title ? `${title} · Anashim` : 'Anashim';
});