import Layout from '@/modules/layout/components/layout.vue';

const ProjectGroupsPage = () => import(
  '@/modules/lf/segments/pages/lf-project-groups-page.vue'
);

const ProjectsPage = () => import(
  '@/modules/lf/segments/pages/lf-projects-page.vue'
);

// TODO: Send to 404 if not for linux
export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true, title: 'Admin Panel' },
    children: [
      {
        name: 'segmentsProjectGroups',
        path: '/admin/project-groups',
        component: ProjectGroupsPage,
        meta: {
          auth: true,
        },
      },
      {
        name: 'segmentsProjects',
        path: '/admin/project-groups/:id/projects',
        component: ProjectsPage,
        meta: {
          auth: true,
        },
      },
    ],
  },
];
