import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

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
        name: 'eagle-eye',
        path: '/eagle-eye',
        component: EagleEyePage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.eagleEyeRead
        }
      }
    ]
  }
]
