import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'

const EagleEyePage = () =>
  import(
    '@/premium/eagle-eye/components/eagle-eye-page.vue'
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
        beforeEnter: (to) => {
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
        }
      }
    ]
  }
]
