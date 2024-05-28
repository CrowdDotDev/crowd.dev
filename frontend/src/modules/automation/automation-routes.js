import Layout from '@/modules/layout/components/layout.vue';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const AutomationsPage = () => import('@/modules/automation/pages/automation-page.vue');

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Automations',
    },
    children: [
      {
        name: 'automations',
        path: '/automations',
        component: AutomationsPage,
        exact: true,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.automationEdit),
        ],
      },
    ],
  },
];
