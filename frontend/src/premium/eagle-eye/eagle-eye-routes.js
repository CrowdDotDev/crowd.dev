import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'
import config from '@/config'
import {
  isFeatureEnabled,
  featureFlags
} from '@/utils/posthog'
import posthog from 'posthog-js'

const isEagleEyeFeatureEnabled = async () => {
  return (
    config.hasPremiumModules &&
    (await isFeatureEnabled(featureFlags.eagleEye))
  )
}

const isEagleEyeNewVersionEnabled = async () => {
  const currentTenant = store.getters['auth/currentTenant']
  const payload = {
    groupType: 'tenant',
    groupKey: currentTenant.id
  }

  await posthog.groupIdentify(payload)
  return (
    config.hasPremiumModules &&
    (await isFeatureEnabled(
      featureFlags.eagleEyeNewVersion
    ))
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
          const currentUser =
            store.getters['auth/currentUser']

          // Redirect to onboard page if user is not onboarded
          if (
            (await isEagleEyeNewVersionEnabled()) &&
            !currentUser.eagleEyeSettings?.onboarded
          ) {
            next('/eagle-eye/onboard')
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
        }
      }
    ]
  }
]
