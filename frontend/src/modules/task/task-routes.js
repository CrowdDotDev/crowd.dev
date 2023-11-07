import Layout from '@/modules/layout/components/layout.vue';

const TaskPage = () => import('@/modules/task/pages/task-page.vue');

export default [
  {
    path: '',
    exact: true,
    component: Layout,
    meta: { auth: true, title: 'Tasks' },
    children: [
      {
        name: 'task',
        path: '/tasks',
        component: TaskPage,
        exact: true,
      },
      {
        path: '/task',
        redirect: () => '/tasks',
      },
    ],
  },
];
