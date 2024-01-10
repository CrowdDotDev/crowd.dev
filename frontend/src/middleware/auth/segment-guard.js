import { hasAccessToProjectGroup } from '@/utils/segments';

/**
 * Segment Guard
 *
 * This middleware runs before rendering any route that has meta.paramSegmentAccess = (route param that holds segmentId)
 *
 * It checks if currentUser has access to segment (if not, redirects to /403)
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

  await store.dispatch('auth/doWaitUntilInit');

  if (!hasAccessToProjectGroup(to.params[to.meta.paramSegmentAccess])) {
    router.push('/403');
  }
}
