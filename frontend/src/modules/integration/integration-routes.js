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
      hideBanner: true,
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
          const segmentId = localStorage.getItem('segmentId');
          const segmentGrandparentId = localStorage.getItem('segmentGrandparentId');

          // Redirect to integrations list page with correct id
          if (segmentId && Object.keys(to.query).length) {
            next({
              name: 'integration',
              params: {
                id: segmentId,
                grandparentId: segmentGrandparentId,
              },
              query: to.query,
            });
            return;
          }

          localStorage.setItem('segmentId', null);
          localStorage.setItem('segmentGrandparentId', null);

          next({ name: 'projectGroupsList' });
        },
      },
      {
        name: 'integration',
        path: '/integrations/:grandparentId/:id',
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
