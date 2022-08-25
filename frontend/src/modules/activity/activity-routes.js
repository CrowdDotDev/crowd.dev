import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const ActivityListPage = () =>
  import(
    '@/modules/activity/components/activity-list-page.vue'
  )
const ActivityViewPage = () =>
  import(
    '@/modules/activity/components/activity-view-page.vue'
  )

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'activity',
        path: '/activities',
        component: ActivityListPage,
        meta: {
          auth: true,
          permission: Permissions.values.activityRead
        }
      },
      {
        name: 'activityView',
        path: '/activities/:id',
        component: ActivityViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.activityRead
        },
        props: true
      }
    ]
  }
]
