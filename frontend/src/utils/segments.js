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
  const { projectGroups } = storeToRefs(lsSegmentsStore);

  if (!projectGroups.value.list.length) {
    return LfService.queryProjectGroups({
      limit: null,
      offset: 0,
      filter: {
        adminOnly: true,
      },
    }).then((list) => {
      const subprojectsIds = list.rows.reduce((acc, projectGroup) => {
        if (projectGroup.id === segmentId) {
          projectGroup.projects.forEach((project) => {
            project.subprojects.forEach((subproject) => {
              acc.push(subproject.id);
            });
          });
        }

        return acc;
      }, []);

      return subprojectsIds.some((id) => adminSegments.includes(id));
    });
  }

  const subprojectsIds = projectGroups.value.list.reduce((acc, projectGroup) => {
    if (projectGroup.id === segmentId) {
      projectGroup.projects.forEach((project) => {
        project.subprojects.forEach((subproject) => {
          acc.push(subproject.id);
        });
      });
    }

    return acc;
  }, []);

  return subprojectsIds.some((id) => adminSegments.includes(id));
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
