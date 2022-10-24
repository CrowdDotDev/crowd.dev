import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const ReportListPage = () =>
  import('@/modules/report/pages/report-list-page.vue')
const ReportFormPage = () =>
  import('@/modules/report/pages/report-form-page.vue')
const ReportViewPage = () =>
  import('@/modules/report/pages/report-view-page.vue')
const ReportPublicViewPage = () =>
  import(
    '@/modules/report/pages/report-view-page-public.vue'
  )

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'report',
        path: '/reports',
        component: ReportListPage,
        meta: {
          auth: true,
          permission: Permissions.values.reportRead
        }
      },
      {
        name: 'reportEdit',
        path: '/reports/:id/edit',
        component: ReportFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.reportEdit
        },
        props: true
      },
      {
        name: 'reportView',
        path: '/reports/:id',
        component: ReportViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.reportRead
        },
        props: true
      }
    ]
  },
  {
    name: 'reportPublicView',
    path: '/tenant/:tenantId/reports/:id/public',
    component: ReportPublicViewPage,
    props: true
  }
]
