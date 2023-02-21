import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'

const EagleEyeOnboardPage = () =>
  import(
    '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
  )

const EagleEyePage = () =>
  import(
    '@/premium/eagle-eye/pages/eagle-eye-page-wrapper.vue'
  )

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true
    },
    children: [
      {
        name: 'eagleEye',
        path: '/eagle-eye',
        component: EagleEyePage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.eagleEyeRead
        },
        props: {
          module: 'eagleEye'
        },
        beforeEnter: async (to, _from, next) => {
          const currentUser =
            store.getters['auth/currentUser']

          // Redirect to onboard page if user is not onboarded
          if (!currentUser.eagleEyeSettings?.onboarded) {
            return next('/eagle-eye/onboard')
          } else if (
            to.query.activeTab !== undefined &&
            store.getters['eagleEye/activeView'].id !==
              to.query.activeTab
          ) {
            store.dispatch(
              'eagleEye/doChangeActiveView',
              to.query.activeTab
            )
          }

          return next()
        }
      },
      {
        name: 'eagleEyeOnboard',
        path: '/eagle-eye/onboard',
        component: EagleEyeOnboardPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.eagleEyeRead
        },
        beforeEnter: async (to, _from, next) => {
          const currentUser =
            store.getters['auth/currentUser']
          // Redirect to onboard page if user is not onboarded
          if (currentUser.eagleEyeSettings?.onboarded) {
            return next('/eagle-eye')
          }

          return next()
        }
      }
    ]
  }
]
