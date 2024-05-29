import Layout from '@/modules/layout/components/layout.vue';
import { PageEventKey } from '@/shared/modules/monitoring/types/event';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

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
      eventKey: PageEventKey.INTEGRATIONS,
      hideBanner: true,
    },
    children: [
      {
        name: 'integrationRedirect',
        path: '/integrations',
        exact: true,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.integrationRead),
          (to, from, next) => {
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
        ],
      },
      {
        name: 'integration',
        path: '/integrations/:grandparentId/:id',
        component: IntegrationListPage,
        exact: true,
        meta: {
          auth: true,
          paramSegmentAccess: {
            name: 'child',
            parameter: 'id',
          },
        },
        beforeEnter: [
          PermissionGuard(LfPermission.integrationRead),
        ],
      },
    ],
  },
];
