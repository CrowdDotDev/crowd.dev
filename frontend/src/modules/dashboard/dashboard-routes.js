import Layout from '@/modules/layout/components/layout.vue';
import { PageEventKey } from '@/shared/modules/monitoring/types/event';

const DashboardPage = () => import('@/modules/dashboard/pages/dashboard-page.vue');

export default [
  {
    path: '',
    exact: true,
    component: Layout,
    meta: {
      auth: true,
      title: 'Overview',
      eventKey: PageEventKey.OVERVIEW,
      segments: {
        requireSelectedProjectGroup: true,
      },
    },
    children: [
      {
        name: 'dashboard',
        path: '',
        component: DashboardPage,
        exact: true,
        meta: {
          auth: true,
        },
      },
    ],
  },
];
