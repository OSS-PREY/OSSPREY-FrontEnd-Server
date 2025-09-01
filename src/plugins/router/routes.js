export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/pages/login.vue'),
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/pages/register.vue'),
      },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/pages/dashboard.vue'),
      },
    ],
  },
];
