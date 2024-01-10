import { store } from '@/store';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';

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

  const { adminSegments = [] } = currentUser;

  if (!adminSegments.length) {
    return false;
  }

  return adminSegments.includes(segmentId);
};
