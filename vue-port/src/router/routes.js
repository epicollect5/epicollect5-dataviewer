export default [
  {
    path: '/',
    redirect: '/table'
  },
  {
    path: '/table',
    name: 'table',
    component: () => import('@/pages/PageTable.vue')
  },
  {
    path: '/:projectSlug/data',
    name: 'legacy-table',
    component: () => import('@/pages/PageTable.vue')
  },
  {
    path: '/map',
    name: 'map',
    component: () => import('@/pages/PageMap.vue')
  },
  {
    path: '/:projectSlug/data/map',
    name: 'legacy-map',
    component: () => import('@/pages/PageMap.vue')
  }
];
