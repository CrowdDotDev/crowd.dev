import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'
import config from '@/config'
import {
  isFeatureEnabled,
  featureFlags
} from '@/utils/posthog'

const isEagleEyeFeatureEnabled = async () => {
  return (
    config.hasPremiumModules &&
    (await isFeatureEnabled(featureFlags.eagleEye))
  )
}

const EagleEyeMainPage = async () => {
  if (!(await isEagleEyeFeatureEnabled())) {
    return EagleEyePaywall()
  }

  return EagleEyePage()
}

const EagleEyeOnboardPage = () =>
  import(
    '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
  )

const EagleEyePage = () =>
  import('@/premium/eagle-eye/pages/eagle-eye-page.vue')

const EagleEyePaywall = () =>
  import('@/modules/layout/pages/paywall-page.vue')

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
        component: EagleEyeMainPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.eagleEyeRead
        },
        props: {
          module: 'eagleEye'
        },
        beforeEnter: async (to, _from, next) => {
          // Redirect to onboard page if user is not onboarded
          if (await isEagleEyeFeatureEnabled()) {
            const currentUser =
              store.getters['auth/currentUser']
            if (!currentUser.eagleEyeSettings?.onboarded) {
              next('/eagle-eye/onboard')
              return
            }
          }

          if (
            to.query.activeTab !== undefined &&
            store.getters['eagleEye/activeView'].id !==
              to.query.activeTab
          ) {
            store.dispatch(
              'eagleEye/doChangeActiveView',
              to.query.activeTab
            )
          }

          next()
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
            next('/eagle-eye')
            return
          }

          next()
        }
      }
    ]
  }
]
