export default [
  {
    path: '/',
    redirect: '/project/data'
  },
  {
    path: '/project/:projectSlug?/data',
    name: 'table',
    component: () => import('@/pages/PageTable.vue')
  },
  {
    path: '/project/:projectSlug?/data/map',
    name: 'map',
    component: () => import('@/pages/PageMap.vue')
  }
];
