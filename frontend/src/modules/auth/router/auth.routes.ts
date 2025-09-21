export default [
  {
    name: 'signin',
    path: '/auth/signin',
    component: () => import('@/modules/auth/pages/signin.page.vue'),
    meta: {
      title: 'Sign in',
    },
  },
  {
    name: 'invitationSignup',
    path: '/auth/invitation/signup',
    component: () => import('@/modules/invitation/pages/invitation-signup.vue'),
    meta: {
      title: 'Join workspace',
    },
  },
  {
    name: 'emptyPermissions',
    path: '/auth/empty-permissions',
    component: () => import('@/modules/auth/pages/empty-permissions.page.vue'),
    meta: {
      notEmptyPermissions: true,
    },
  },
  {
    name: 'callback',
    path: '/auth/callback',
    component: () => import('@/modules/auth/pages/callback.page.vue'),
    meta: { title: 'Logging you in...' },
  },
  {
    name: 'logout',
    path: '/auth/logout',
    component: () => import('@/modules/auth/pages/logout.page.vue'),
    meta: { title: 'Logging out...' },
  },
];
