import { store } from '@/store';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import { useAuthStore } from '@/modules/auth/store/auth.store';

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
  const authStore = useAuthStore();
  const { user, tenant } = storeToRefs(authStore);

  const permissionChecker = new PermissionChecker(tenant.value, user.value);

  const isAdmin = permissionChecker.currentUserRolesIds.includes(
    Roles.values.admin,
  );

  if (isAdmin) {
    return true;
  }

  const tenantUser = user.value.tenants.find((t) => t.tenantId === tenant.value.id);
  const { adminSegments = [] } = tenantUser;

  if (!adminSegments.length) {
    return false;
  }

  const lsSegmentsStore = useLfSegmentsStore();
  const { adminProjectGroups } = storeToRefs(lsSegmentsStore);

  const segments = adminProjectGroups.value.list.map((p) => p.id);

  return segments.includes(segmentId);
};

export const hasAccessToSegmentId = (segmentId) => {
  const authStore = useAuthStore();
  const { user, tenant } = storeToRefs(authStore);

  const permissionChecker = new PermissionChecker(tenant.value, user.value);

  const isAdmin = permissionChecker.currentUserRolesIds.includes(
    Roles.values.admin,
  );

  if (isAdmin) {
    return true;
  }
  const tenantUser = user.value?.tenants.find((t) => t.tenantId === tenant.value.id);
  const { adminSegments = [] } = tenantUser;

  if (!adminSegments.length) {
    return false;
  }

  return adminSegments.includes(segmentId);
};
