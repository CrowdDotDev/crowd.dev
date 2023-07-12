import Layout from '@/modules/layout/components/layout.vue';
import AuthLayout from '@/modules/auth/layouts/auth-layout.vue';

const SignupPage = () => import('@/modules/auth/pages/signup-page.vue');

const SigninPage = () => import('@/modules/auth/pages/signin-page.vue');

const ForgotPasswordPage = () => import('@/modules/auth/pages/forgot-password-page.vue');

const EmailUnverifiedPage = () => import('@/modules/auth/pages/email-unverified-page.vue');

const ProfileFormPage = () => import('@/modules/auth/pages/profile-form-page.vue');
const PasswordResetPage = () => import('@/modules/auth/pages/password-reset-page.vue');
const VerifyEmailPage = () => import('@/modules/auth/pages/verify-email-page.vue');
const InvitationPage = () => import('@/modules/auth/pages/invitation-page.vue');
const EmptyPermissionsPage = () => import('@/modules/auth/pages/empty-permissions-page.vue');
const AuthCallback = () => import('@/modules/auth/pages/callback.vue');
const AuthLogout = () => import('@/modules/auth/pages/logout.vue');

export default [
  {
    name: 'auth',
    path: '/auth',
    component: AuthLayout,
    redirect: '/auth/signup',
    children: [
      // {
      //   name: 'signup',
      //   path: 'signup',
      //   component: SignupPage,
      //   meta: {
      //     unauth: true,
      //     title: 'Sign up',
      //   },
      // },
      {
        name: 'signin',
        path: 'signin',
        component: SigninPage,
        meta: {
          unauth: true,
          title: 'Sign in',
        },
      },
      // {
      //   name: 'forgotPassword',
      //   path: 'forgot-password',
      //   component: ForgotPasswordPage,
      //   meta: {
      //     unauth: true,
      //     title: 'Forgot Password',
      //   },
      // },
      // {
      //   name: 'passwordReset',
      //   path: 'password-reset',
      //   component: PasswordResetPage,
      // },
      {
        name: 'emailUnverified',
        path: 'email-unverified',
        component: EmailUnverifiedPage,
        meta: {
          title: 'Verify Email',
        },
      },
      {
        name: 'verifyEmail',
        path: 'verify-email',
        component: VerifyEmailPage,
        meta: {
          title: 'Signup',
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
