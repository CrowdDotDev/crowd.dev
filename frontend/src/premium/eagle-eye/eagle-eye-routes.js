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
      }
    ]
  }
]
