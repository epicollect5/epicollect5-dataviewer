import env from '@/core/config/env';

//keep the slug in the url, so it can be edited to open another project;
//fall back to the slugless path when no default is configured (production)
const defaultProjectPath = env.defaultProjectSlug ? `/project/${env.defaultProjectSlug}/data` : '/project/data';

export default [
  {
    path: '/',
    redirect: defaultProjectPath
  },
  {
    path: '/project/:projectSlug?/data',
    name: 'data',
    component: () => import('@/pages/PageData.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/PageNotFound.vue')
  }
];
