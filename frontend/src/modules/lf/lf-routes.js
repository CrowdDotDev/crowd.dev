import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';
import { hasAccessToProjectGroup } from '@/utils/segments';

const ProjectGroupsListPage = () => import(
  '@/modules/lf/segments/pages/lf-project-groups-list-page.vue'
);

const ProjectsPage = () => import(
  '@/modules/lf/segments/pages/lf-projects-page.vue'
);

const AdminPanelPage = () => import(
  '@/modules/lf/segments/pages/lf-admin-panel-page.vue'
);

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      hideBanner: true,
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
        name: 'adminPanel',
        path: '/admin',
        component: AdminPanelPage,
        meta: {
          title: 'Admin Panel',
          permission: Permissions.values.projectGroupCreate,
        },
      },
      {
        name: 'adminProjects',
        path: '/admin/project-groups/:id/projects',
        component: ProjectsPage,
        meta: {
          auth: true,
          title: 'Admin Panel',
          permission: Permissions.values.projectCreate,
          paramSegmentAccess: 'id',
        },
      },
    ],
  },
];
