import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

const IntegrationListPage = () => import(
  '@/modules/integration/components/integration-list-page.vue'
);

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true, title: 'Integrations' },
    children: [
      {
        name: 'integration',
        path: '/integrations',
        component: IntegrationListPage,
        meta: {
          auth: true,
          permission: Permissions.values.integrationRead,
        },
      },
    ],
  },
];
