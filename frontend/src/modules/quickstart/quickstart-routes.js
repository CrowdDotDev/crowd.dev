import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

const QuickstartPage = () => import('@/modules/quickstart/pages/quickstart-page.vue');

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Welcome aboard',
    },
    children: [
      {
        name: 'quickstart',
        path: '/quickstart',
        component: QuickstartPage,
        exact: true,
        meta: {
          auth: true,
        },
      },
    ],
  },
];
