import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

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
          permission: Permissions.values.automationEdit,
        },
      },
    ],
  },
];
