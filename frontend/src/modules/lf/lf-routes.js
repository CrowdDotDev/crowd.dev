import Layout from '@/modules/layout/components/layout.vue';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

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
        },
        beforeEnter: [
          PermissionGuard(LfPermission.projectGroupEdit),
        ],
      },
      {
        name: 'adminProjects',
        path: '/admin/project-groups/:id/projects',
        component: ProjectsPage,
        meta: {
          auth: true,
          title: 'Admin Panel',
          paramSegmentAccess: {
            name: 'grandparent',
            parameter: 'id',
          },
        },
        beforeEnter: [
          PermissionGuard(LfPermission.projectEdit),
        ],
      },
    ],
  },
];
