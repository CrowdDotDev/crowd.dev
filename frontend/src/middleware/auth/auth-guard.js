import { PermissionChecker } from '@/modules/user/permission-checker';
import config from '@/config';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';

function isGoingToIntegrationsPage(to) {
  return to.name === 'integration';
}

/**
 * Auth Guard
 *
 * This middleware runs before rendering any route that has meta.auth = true
 *
 * It uses the PermissionChecker to validate if:
 * - User is authenticated, and both currentTenant & currentUser exist within our store (if not, redirects to /auth/signin)
 * - Email of that user is verified (if not, redirects to /auth/email-unverified)
 * - User has permissions (if not, redirects to /auth/empty-permissions)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({ to, store, router }) {
  if (!to.meta || !to.meta.auth) {
    return;
  }
  await store.dispatch('auth/doWaitUntilInit');

  const currentUser = store.getters['auth/currentUser'];

  const permissionChecker = new PermissionChecker(
    store.getters['auth/currentTenant'],
    currentUser,
  );

  if (!permissionChecker.isAuthenticated) {
    router.push({ path: '/auth/signin' });
    return;
  }

  // Temporary fix
  if (
    to.meta.permission
    && (!permissionChecker.match(to.meta.permission)
      || permissionChecker.lockedForSampleData(
        to.meta.permission,
      ))
  ) {
    router.push('/403');
    return;
  }

  if (
    to.path !== '/auth/empty-permissions'
      && permissionChecker.isEmailVerified
      && permissionChecker.isEmptyPermissions
  ) {
    router.push({
      path: '/auth/empty-permissions',
    });
  }
}
