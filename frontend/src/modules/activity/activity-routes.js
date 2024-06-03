import Layout from '@/modules/layout/components/layout.vue';
import { PageEventKey } from '@/shared/modules/monitoring/types/event';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const ActivityListPage = () => import('@/modules/activity/pages/activity-list-page.vue');

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Activities',
      eventKey: PageEventKey.ACTIVITIES,
      segments: {
        requireSelectedProjectGroup: true,
      },
    },
    children: [
      {
        name: 'activity',
        path: '/activities',
        component: ActivityListPage,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.activityRead),
        ],
      },
    ],
  },
];
