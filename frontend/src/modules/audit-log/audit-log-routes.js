import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const AuditLogPage = () =>
  import(
    '@/modules/audit-log/components/audit-log-page.vue'
  )

export default [
  {
    path: '',
    component: Layout,
    children: [
      {
        name: 'auditLogs',
        path: '/audit-logs',
        component: AuditLogPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.auditLogRead
        }
      }
    ]
  }
]
