import OnboardLayout from '@/modules/onboard/layouts/onboard-layout.vue'

const OnboardPage = () =>
  import('@/modules/onboard/pages/onboard-page.vue')

export default [
  {
    path: '/onboard',
    component: OnboardLayout,

    children: [
      {
        name: 'onboard',
        path: '',
        component: OnboardPage,
        meta: {
          auth: true
        }
      }
    ]
  }
]
