import { buildInitialState, store } from '@/store'

const OnboardPage = () =>
  import('@/modules/onboard/pages/onboard-page.vue')

export default [
  {
    name: 'onboard',
    path: '/onboard',
    component: OnboardPage,
    meta: {
      auth: true
    },
    beforeEnter: () => {
      const initialState = buildInitialState(true)
      console.log(initialState)
      store.replaceState(initialState)
      console.log('store replaced')
    }
  }
]
