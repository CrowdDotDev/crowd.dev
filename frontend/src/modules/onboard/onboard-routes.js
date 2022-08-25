const OnboardPage = () =>
  import('@/modules/onboard/components/onboard-page.vue')

export default [
  {
    name: 'onboard',
    path: '/onboard',
    component: OnboardPage,
    exact: true,
    meta: {
      auth: true
    }
  }
]
