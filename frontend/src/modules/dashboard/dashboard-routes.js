import Layout from '@/modules/layout/components/layout.vue';

const DashboardPage = () => import('@/modules/dashboard/pages/dashboard-page.vue');

export default [
  {
    path: '/',
    exact: true,
    component: Layout,
    meta: {
      auth: true,
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
        meta: { auth: true },
      },
    ],
  },
];
