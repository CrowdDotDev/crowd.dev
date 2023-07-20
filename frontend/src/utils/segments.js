import { store } from '@/store';
import { PermissionChecker } from '@/modules/user/permission-checker';
import Roles from '@/security/roles';

export const getSegmentsFromProjectGroup = (projectGroup, options) => {
  if (!projectGroup) {
    return [];
  }

  if (options?.url?.includes('/member/query') || options?.url?.includes('/member/active')) {
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

  const permissionChecker = new PermissionChecker(
    currentTenant,
    currentUser,
  );

  const isAdmin = permissionChecker.currentUserRolesIds.includes(Roles.values.projectAdmin);
  const isViewer = permissionChecker.currentUserRolesIds.includes(Roles.values.projectAdmin);

  if (isAdmin) {
    return true;
  } if (isViewer) {
    return false;
  }

  const { segments = [] } = currentUser;

  if (!segments.length) {
    return false;
  }

  return segments.includes(segmentId);
};

export const getUserSegments = (allSegments) => {
  const currentUser = store.getters['auth/currentUser'];
  const { segments = [] } = currentUser;

  return allSegments.filter((s) => segments.some((id) => id === s.id));
};
