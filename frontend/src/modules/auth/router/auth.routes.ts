import AuthLayout from '@/modules/auth-old/layouts/auth-layout.vue';

const EmptyPermissionsPage = () => import('@/modules/auth-old/pages/empty-permissions-page.vue');
const AuthCallback = () => import('@/modules/auth-old/pages/callback.vue');
const AuthLogout = () => import('@/modules/auth-old/pages/logout.vue');
export default [
  {
    name: 'auth',
    path: '/auth',
    component: AuthLayout,
    redirect: '/auth/signin',
    children: [
      {
        name: 'signin',
        path: 'signin',
        component: () => import('@/modules/auth-old/pages/signin-page.vue'),
        meta: {
          title: 'Sign in',
        },
      },
      {
        name: 'emptyPermissions',
        path: 'empty-permissions',
        component: EmptyPermissionsPage,
        meta: {
          notEmptyPermissions: true,
        },
      },
    ],
  },
  {
    name: 'callback',
    path: '/auth/callback',
    component: AuthCallback,
    meta: { title: 'Logging you in...' },
  },
  {
    name: 'logout',
    path: '/auth/logout',
    component: AuthLogout,
    meta: { title: 'Logging out...' },
  },
];
