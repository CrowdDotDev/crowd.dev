import Layout from '@/modules/layout/components/layout.vue';

const TaskPage = () => import('@/modules/task/pages/task-page.vue');

export default [
  {
    path: '',
    exact: true,
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'task',
        path: '/task',
        component: TaskPage,
        exact: true,
      },
    ],
  },
];
