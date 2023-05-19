import Layout from '@/modules/layout/components/layout.vue';

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
      title: 'Admin Panel',
      requiresSegmentsFeatureFlagEnabled: true,
    },
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
