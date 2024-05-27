import Layout from '@/modules/layout/components/layout.vue';
import { store } from '@/store';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { PageEventKey } from '@/shared/modules/monitoring/types/event';

const EagleEyePage = () => import(
  '@/modules/eagle-eye/pages/eagle-eye-page-wrapper.vue'
);

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Community Lens',
      eventKey: PageEventKey.COMMUNITY_LENS,
      hideBanner: true,
    },
    children: [
      {
        name: 'eagleEye',
        path: '/community-lens',
        component: EagleEyePage,
        exact: true,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.eagleEyeRead),
          async (to, _from, next) => {
            if (
              to.query.activeTab !== undefined
              && store.getters['eagleEye/activeView'].id
              !== to.query.activeTab
            ) {
              store.dispatch(
                'eagleEye/doChangeActiveView',
                to.query.activeTab,
              );
            }

            return next();
          },
        ],
      },
    ],
  },
];
