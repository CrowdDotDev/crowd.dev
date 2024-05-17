import Layout from '@/modules/layout/components/layout.vue';
import { store } from '@/store';
import { PermissionGuard } from '@/shared/modules/permissions/router/PermissionGuard';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const OrganizationListPage = () => import(
  '@/modules/organization/pages/organization-list-page.vue'
);
const OrganizationViewPage = () => import(
  '@/modules/organization/pages/organization-view-page.vue'
);

const OrganizationFormPage = () => import(
  '@/modules/organization/pages/organization-form-page.vue'
);

const OrganizationMergeSuggestionsPage = () => import(
  '@/modules/organization/pages/organization-merge-suggestions-page.vue'
);

const OrganizationsMainPage = async () => OrganizationListPage();
export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: {
      auth: true,
      title: 'Organizations',
      segments: {
        requireSelectedProjectGroup: true,
      },
    },
    children: [
      {
        name: 'organization',
        path: '/organizations',
        component: OrganizationsMainPage,
        meta: {
          auth: true,
        },
        props: {
          module: 'organizations',
        },
        beforeEnter: [
          PermissionGuard(LfPermission.organizationRead),
        ],
      },
      {
        name: 'organizationCreate',
        path: '/organizations/new',
        component: OrganizationFormPage,
        meta: {
          auth: true,
        },
        beforeEnter: [
          PermissionGuard(LfPermission.organizationCreate),
        ],
      },
      {
        name: 'organizationEdit',
        path: '/organizations/:id/edit',
        component: OrganizationFormPage,
        meta: {
          auth: true,
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.organizationEdit),
        ],
      },
      {
        name: 'organizationView',
        path: '/organizations/:id',
        component: OrganizationViewPage,
        meta: {
          title: 'Organization',
          auth: true,
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.organizationRead),
        ],
      },
      {
        name: 'organizationMergeSuggestions',
        path: '/organizations/merge-suggestions',
        component: OrganizationMergeSuggestionsPage,
        meta: {
          auth: true,
        },
        props: true,
        beforeEnter: [
          PermissionGuard(LfPermission.mergeOrganizations),
        ],
      },
    ],
  },
];
