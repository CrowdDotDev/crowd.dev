import { store } from '@/store';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { LfService } from '@/modules/lf/segments/lf-segments-service';

export const getSegmentsFromProjectGroup = (projectGroup, options) => {
  if (!projectGroup) {
    return [];
  }

  if (options?.url?.includes('/member/query') || options?.url?.includes('/member/active') || options?.url?.includes('/organization/query')) {
    return [projectGroup.id];
  }

  return projectGroup.projects.reduce((acc, project) => {
    project.subprojects.forEach((subproject) => {
      acc.push(subproject.id);
    });

    return acc;
  }, []);
};

export const hasAccessToProjectGroup = (segmentId) => {
  const currentUser = store.getters['auth/currentUser'];
  const currentTenant = store.getters['auth/currentTenant'];

  const permissionChecker = new PermissionChecker(currentTenant, currentUser);

  const isAdmin = permissionChecker.currentUserRolesIds.includes(
    Roles.values.admin,
  );

  if (isAdmin) {
    return true;
  }

  const tenant = currentUser.tenants.find((t) => t.tenantId === currentTenant.id);
  const { adminSegments = [] } = tenant;

  if (!adminSegments.length) {
    return false;
  }

  const lsSegmentsStore = useLfSegmentsStore();
  const { adminProjectGroups } = storeToRefs(lsSegmentsStore);

  const segments = adminProjectGroups.value.list.map((p) => p.id);

  return segments.includes(segmentId);
};

export const hasAccessToSegmentId = (segmentId) => {
  const currentUser = store.getters['auth/currentUser'];
  const currentTenant = store.getters['auth/currentTenant'];

  const permissionChecker = new PermissionChecker(currentTenant, currentUser);

  const isAdmin = permissionChecker.currentUserRolesIds.includes(
    Roles.values.admin,
  );

  if (isAdmin) {
    return true;
  }

  const tenant = currentUser.tenants.find((t) => t.tenantId === currentTenant.id);
  const { adminSegments = [] } = tenant;

  if (!adminSegments.length) {
    return false;
  }

  return adminSegments.includes(segmentId);
};
