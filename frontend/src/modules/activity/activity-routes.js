import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';
import { store } from '@/store';

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
        beforeEnter: (to) => {
          if (
            to.query.activeTab !== undefined
            && store.getters['activity/activeView'].id
            !== to.query.activeTab
          ) {
            store.dispatch(
              'activity/doChangeActiveView',
              to.query.activeTab,
            );
          }
        },
      },
    ],
  },
];
