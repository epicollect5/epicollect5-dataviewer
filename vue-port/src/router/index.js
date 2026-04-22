import { createRouter, createWebHistory } from '@ionic/vue-router';
import routes from '@/router/routes';

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
