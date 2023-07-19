import { store } from '@/store';

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
  const { segments = [] } = currentUser;

  if (!segments.length) {
    return false;
  }

  return segments.includes(segmentId);
};

export const getUserSegments = (allSegments) => {
  const currentUser = store.getters['auth/currentUser'];
  const { segments = [] } = currentUser;

  return allSegments.filter((s) => segments.includes(s.id));
};
