import Layout from '@/modules/layout/components/layout.vue'

const DashboardPage = () =>
  import(
    '@/modules/dashboard/components/dashboard-page.vue'
  )

export default [
  {
    path: '',
    exact: true,
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'dashboard',
        path: '',
        component: DashboardPage,
        exact: true,
        meta: { auth: true }
      }
    ]
  }
]
