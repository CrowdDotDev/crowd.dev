import Layout from '@/modules/layout/components/layout.vue';
import AuthLayout from '@/modules/auth/layouts/auth-layout.vue';

const SigninPage = () => import('@/modules/auth/pages/signin-page.vue');

const ProfileFormPage = () => import('@/modules/auth/pages/profile-form-page.vue');
const InvitationPage = () => import('@/modules/auth/pages/invitation-page.vue');
const EmptyPermissionsPage = () => import('@/modules/auth/pages/empty-permissions-page.vue');
const AuthCallback = () => import('@/modules/auth/pages/callback.vue');
const AuthLogout = () => import('@/modules/auth/pages/logout.vue');

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
        component: SigninPage,
        meta: {
          unauth: true,
          title: 'Sign in',
        },
      },
      {
        name: 'emptyPermissions',
        path: 'empty-permissions',
        component: EmptyPermissionsPage,
        meta: {
          auth: true,
          notEmptyPermissions: true,
        },
      },
      {
        name: 'invitation',
        path: 'invitation',
        component: InvitationPage,
        meta: {
          title: 'Invitation',
        },
      },
    ],
  },
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Profile Settings',
    },
    children: [
      {
        name: 'editProfile',
        path: '/auth/edit-profile',
        component: ProfileFormPage,
        meta: { auth: true },
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
