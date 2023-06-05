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
    exact: true,
    meta: {
      auth: true,
      title: 'Integrations',
    },
    children: [
      {
        name: 'integrationRedirect',
        path: '/integrations',
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.integrationRead,
        },
        beforeEnter: (to, from, next) => {
          const integrationId = localStorage.getItem('segmentId');

          // Redirect to integrations list page with correct id
          if (integrationId && Object.keys(to.query).length) {
            next({
              name: 'integration',
              params: {
                id: integrationId,
              },
              query: to.query,
            });
            return;
          }

          localStorage.setItem('segmentId', null);

          next({ name: 'projectGroupsList' });
        },
      },
      {
        name: 'integration',
        path: '/integrations/:id',
        component: IntegrationListPage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.integrationRead,
        },
      },
    ],
  },
];
