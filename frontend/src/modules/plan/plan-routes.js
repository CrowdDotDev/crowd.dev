import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const PlanPage = () =>
  import('@/modules/plan/components/plan-page.vue')

export default [
  {
    path: '',
    component: Layout,
    children: [
      {
        name: 'plan',
        path: '/plan',
        component: PlanPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.planRead
        }
      }
    ]
  }
]
