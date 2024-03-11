import { hasAccessToProjectGroup, hasAccessToSegmentId } from '@/utils/segments';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

/**
 * Segment Guard
 *
 * This middleware runs before rendering any route that has meta.paramSegmentAccess = (route param that holds segmentId)
 *
 * It checks if user has access to segment (if not, redirects to /403)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({ to, store, router }) {
  if (!to.meta || !to.meta.paramSegmentAccess) {
    return;
  }

  const lsSegmentsStore = useLfSegmentsStore();
  const isCheckingProjectGroup = to.meta.paramSegmentAccess.name === 'grandparent';
  let hasPermission;

  if (isCheckingProjectGroup) {
    await lsSegmentsStore.listAdminProjectGroups();

    hasPermission = hasAccessToProjectGroup(to.params[to.meta.paramSegmentAccess.parameter]);
  } else {
    hasPermission = hasAccessToSegmentId(to.params[to.meta.paramSegmentAccess.parameter]);
  }

  if (!hasPermission) {
    router.push('/403');
  }
}
