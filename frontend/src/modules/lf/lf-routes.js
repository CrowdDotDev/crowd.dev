import Layout from '@/modules/layout/components/layout.vue';

const ProjectGroupsListPage = () => import(
  '@/modules/lf/segments/pages/lf-project-groups-list-page.vue'
);

const ProjectGroupsPage = () => import(
  '@/modules/lf/segments/pages/lf-project-groups-page.vue'
);

const ProjectsPage = () => import(
  '@/modules/lf/segments/pages/lf-projects-page.vue'
);

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
    },
    children: [
      {
        name: 'projectGroupsList',
        path: '/project-groups',
        component: ProjectGroupsListPage,
        meta: {
          auth: true,
          title: 'Project Groups',
        },
      },
      {
        name: 'adminProjectGroups',
        path: '/admin/project-groups',
        component: ProjectGroupsPage,
        meta: {
          title: 'Admin Panel',
        },
      },
      {
        name: 'adminProjects',
        path: '/admin/project-groups/:id/projects',
        component: ProjectsPage,
        meta: {
          auth: true,
          title: 'Admin Panel',
        },
      },
    ],
  },
];
