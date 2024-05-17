import Layout from '@/modules/layout/components/layout.vue';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const ReportListPage = () => import('@/modules/report/pages/report-list-page.vue');
const ReportFormPage = () => import('@/modules/report/pages/report-form-page.vue');
const ReportViewPage = () => import('@/modules/report/pages/report-view-page.vue');
const ReportTemplatePage = () => import(
  '@/modules/report/pages/templates/report-template-page.vue'
);
const ReportViewPagePublic = () => import(
  '@/modules/report/pages/report-view-page-public.vue'
);

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Reports',
      segments: {
        requireSelectedProjectGroup: true,
      },
    },
    children: [
      {
        name: 'report',
        path: '/reports',
        component: ReportListPage,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.reportRead),
        ],
      },
      {
        name: 'reportTemplate',
        path: '/reports/default/:id',
        component: ReportTemplatePage,
        meta: {
          auth: true,
          title: 'Report',
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.reportRead),
        ],
      },
      {
        name: 'reportEdit',
        path: '/reports/:segmentId/:id/edit',
        component: ReportFormPage,
        meta: {
          auth: true,
          title: 'Report',
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.reportEdit),
        ],
      },
      {
        name: 'reportView',
        path: '/reports/:segmentId/:id',
        component: ReportViewPage,
        meta: {
          auth: true,
          title: 'Report',
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.reportRead),
        ],
      },
    ],
  },
  {
    name: 'reportPublicView',
    path: '/tenant/:tenantId/reports/:segmentId/:id/public',
    component: ReportViewPagePublic,
    props: true,
  },
];
