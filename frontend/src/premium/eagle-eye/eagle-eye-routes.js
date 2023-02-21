import config from '@/config'
import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'
import { FeatureFlag } from '@/unleash'

const EagleEyeOnboardPage = () =>
  import(
    '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
  )

const EagleEyeOnboardPage = () =>
  import(
    '@/premium/eagle-eye/pages/eagle-eye-onboard-page.vue'
  )

const EagleEyePage = () =>
  import(
    '@/premium/eagle-eye/pages/eagle-eye-page-wrapper.vue'
  )

async function isEagleEyeFeatureEnabled() {
  return (
    config.hasPremiumModules &&
    (await FeatureFlag.isFlagEnabled(
      FeatureFlag.flags.eagleEye
    ))
  )
}

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
