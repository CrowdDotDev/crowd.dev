import Layout from '@/modules/layout/components/layout.vue';
import Permissions from '@/security/permissions';

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
          permission: Permissions.values.reportRead,
        },
      },
      {
        name: 'reportTemplate',
        path: '/reports/template/:id',
        component: ReportTemplatePage,
        meta: {
          auth: true,
          permission: Permissions.values.reportRead,
        },
        props: true,
      },
      {
        name: 'reportEdit',
        path: '/reports/:segmentId/:id/edit',
        component: ReportFormPage,
        meta: {
          auth: true,
          permission: Permissions.values.reportEdit,
        },
        props: true,
      },
      {
        name: 'reportView',
        path: '/reports/:segmentId/:id',
        component: ReportViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.reportRead,
        },
        props: true,
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
