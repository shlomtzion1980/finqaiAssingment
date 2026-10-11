import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import { installFocusOnNavigation } from './composables/useFocusOnNavigation';
import { router } from './router';
import './styles/base.css';

installFocusOnNavigation(router);

createApp(App).use(createPinia()).use(router).mount('#app');
