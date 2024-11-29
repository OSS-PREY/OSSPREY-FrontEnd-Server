export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/default.vue'), // This points to your layout
    children: [
      {
        path: '', // The empty path makes this the default child route
        name: 'Dashboard',
        component: () => import('@/pages/dashboard.vue'), // This points to your Dashboard component
      },
    ],
  },
];
