import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const SettingsPage = () =>
  import('@/modules/settings/pages/settings-page.vue')

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true
    },
    children: [
      {
        name: 'settings',
        path: '/settings',
        component: SettingsPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.settingsEdit
        }
      }
    ]
  }
]
