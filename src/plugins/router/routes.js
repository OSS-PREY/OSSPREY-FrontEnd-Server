export const routes = [
  {
    path: '/',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: '',
        name: 'Login',
        component: () => import('@/pages/login.vue'),
        alias: '/login',
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
  {
    path: '/repos',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: '',
        name: 'Repos',
        component: () => import('@/pages/repos.vue'),
      },
    ],
  },
  {
    path: '/account-settings',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: '',
        name: 'AccountSettings',
        component: () => import('@/pages/account-settings.vue'),
      },
    ],
  },
  {
    path: '/profile',
    component: () => import('@/layouts/default.vue'),
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/pages/profile.vue'),
      },
    ],
  },
];
