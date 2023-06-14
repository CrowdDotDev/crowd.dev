import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

const ActivityListPage = () => import('@/modules/activity/pages/activity-list-page.vue');

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true, title: 'Activities' },
    children: [
      {
        name: 'activity',
        path: '/activities',
        component: ActivityListPage,
        meta: {
          auth: true,
          permission: Permissions.values.activityRead,
        },
      },
    ],
  },
];
