import AuthLayout from '@/modules/auth-old/layouts/auth-layout.vue';

const SigninPage = () => import('@/modules/auth-old/pages/signin-page.vue');

const InvitationPage = () => import('@/modules/auth-old/pages/invitation-page.vue');
const TermsAndPrivacyPage = () => import('@/modules/auth-old/pages/terms-and-privacy.vue');
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
      {
        name: 'terms-and-privacy',
        path: 'terms-and-privacy',
        component: TermsAndPrivacyPage,
        meta: { title: 'Terms of service and privacy policy' },
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
