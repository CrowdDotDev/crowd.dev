const OnboardPage = () =>
  import('@/modules/onboard/pages/onboard-page.vue')

export default [
  {
    name: 'onboard',
    path: '/onboard',
    component: OnboardPage,
    meta: {
      auth: true
    }
  }
]
