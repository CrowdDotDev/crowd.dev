import Layout from '@/modules/layout/components/layout.vue'

const SigninPage = () =>
  import('@/modules/auth/components/signin-page.vue')
const SignupPage = () =>
  import('@/modules/auth/components/signup-page.vue')
const ForgotPasswordPage = () =>
  import(
    '@/modules/auth/components/forgot-password-page.vue'
  )
const EmailUnverifiedPage = () =>
  import(
    '@/modules/auth/components/email-unverified-page.vue'
  )
const AuthTenantPage = () =>
  import('@/modules/auth/components/tenant-page.vue')
const ProfileFormPage = () =>
  import('@/modules/auth/components/profile-form-page.vue')
const PasswordResetPage = () =>
  import(
    '@/modules/auth/components/password-reset-page.vue'
  )
const VerifyEmailPage = () =>
  import('@/modules/auth/components/verify-email-page.vue')
const InvitationPage = () =>
  import('@/modules/auth/components/invitation-page.vue')
const PasswordChangeFormPage = () =>
  import(
    '@/modules/auth/components/password-change-form-page.vue'
  )
const EmptyPermissionsPage = () =>
  import(
    '@/modules/auth/components/empty-permissions-page.vue'
  )

export default [
  {
    name: 'signin',
    path: '/auth/signin',
    component: SigninPage,
    meta: { unauth: true }
  },
  {
    name: 'signup',
    path: '/auth/signup',
    component: SignupPage,
    meta: { unauth: true }
  },
  {
    name: 'forgotPassword',
    path: '/auth/forgot-password',
    component: ForgotPasswordPage,
    meta: { unauth: true }
  },
  {
    name: 'emailUnverified',
    path: '/auth/email-unverified',
    component: EmailUnverifiedPage,
    meta: { auth: true, emailAlreadyVerified: true }
  },
  {
    name: 'authTenant',
    path: '/auth/tenant',
    component: AuthTenantPage,
    meta: { auth: true, notEmptyTenant: true }
  },
  {
    name: 'emptyPermissions',
    path: '/auth/empty-permissions',
    component: EmptyPermissionsPage,
    meta: { auth: true, notEmptyPermissions: true }
  },
  {
    name: 'invitation',
    path: '/auth/invitation',
    component: InvitationPage,
    meta: {}
  },
  {
    name: 'verifyEmail',
    path: '/auth/verify-email',
    component: VerifyEmailPage
  },
  {
    name: 'passwordReset',
    path: '/auth/password-reset',
    component: PasswordResetPage
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
        meta: { auth: true }
      },
      {
        name: 'passwordChange',
        path: '/password-change',
        component: PasswordChangeFormPage,
        meta: { auth: true }
      }
    ]
  }
]
