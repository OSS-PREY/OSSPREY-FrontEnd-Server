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
      {
        path: 'reset-password',
        name: 'ResetPassword',
        component: () => import('@/pages/reset-password.vue'),
      },
      {
        // GitHub redirects back here with ?code=... after the OAuth consent.
        path: 'github/callback',
        name: 'GitHubCallback',
        component: () => import('@/pages/github-callback.vue'),
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
  // Without this an unknown URL renders a blank page; the 404 component
  // already exists but is otherwise never routed.
  {
    path: '/:pathMatch(.*)*',
    component: () => import('@/layouts/blank.vue'),
    children: [
      {
        path: '',
        name: 'NotFound',
        component: () => import('@/pages/[...error].vue'),
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
