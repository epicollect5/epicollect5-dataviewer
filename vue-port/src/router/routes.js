export default [
  {
    path: '/',
    redirect: '/project/data'
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
