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

export default [
  {
    name: 'auth',
    path: '/auth',
    component: AuthLayout,
    redirect: '/auth/signup',
    children: [
      {
        name: 'signup',
        path: 'signup',
        component: SignupPage,
        meta: { unauth: true },
      },
      {
        name: 'signin',
        path: 'signin',
        component: SigninPage,
        meta: { unauth: true },
      },
      {
        name: 'forgotPassword',
        path: 'forgot-password',
        component: ForgotPasswordPage,
        meta: { unauth: true },
      },
      {
        name: 'passwordReset',
        path: 'password-reset',
        component: PasswordResetPage,
      },
      {
        name: 'emailUnverified',
        path: 'email-unverified',
        component: EmailUnverifiedPage,
        meta: { auth: true, emailAlreadyVerified: true },
      },
      {
        name: 'verifyEmail',
        path: 'verify-email',
        component: VerifyEmailPage,
      },
      {
        name: 'emptyPermissions',
        path: 'empty-permissions',
        component: EmptyPermissionsPage,
        meta: { auth: true, notEmptyPermissions: true },
      },
      {
        name: 'invitation',
        path: 'invitation',
        component: InvitationPage,
        meta: {},
      },
    ],
  },
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'editProfile',
        path: '/auth/edit-profile',
        component: ProfileFormPage,
        meta: { auth: true },
      },
    ],
  },
];
