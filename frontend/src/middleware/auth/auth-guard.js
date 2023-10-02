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
 * - User is onboarded (if not, redirects to /onboard)
 * - User has permissions (if not, redirects to /auth/empty-permissions)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({
  to, from, store, router,
}) {
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

  if (
    to.path !== '/auth/email-unverified'
    && !permissionChecker.isEmailVerified
  ) {
    router.push({ path: '/auth/email-unverified' });
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

  if (!currentUser.acceptedTermsAndPrivacy) {
    router.push({ path: '/auth/terms-and-privacy' });
    return;
  }

  if (
    ['multi', 'multi-with-subdomain'].includes(
      config.tenantMode,
    )
    && !tenantSubdomain.isSubdomain
  ) {
    // Protect onboard routes if user is already onboarded
    if ((to.path === '/onboard' || (from.path !== '/onboard' && to.path === '/onboard/demo'))
      && (!permissionChecker.isEmptyTenant && store.getters['auth/currentTenant'].onboardedAt)) {
      router.push('/');
    }

    if (to.path === '/onboard/demo' && (permissionChecker.isEmptyTenant || !store.getters['auth/currentTenant'].onboardedAt)) {
      router.push('/onboard');
    }

    if (
      to.path !== '/onboard'
      && permissionChecker.isEmailVerified
      && (permissionChecker.isEmptyTenant
        || !store.getters['auth/currentTenant'].onboardedAt)
    ) {
      router.push({
        path: '/onboard',
        query: isGoingToIntegrationsPage(to)
          ? to.query
          : undefined,
      });
    }
  } else if (
    to.path !== '/auth/empty-permissions'
      && permissionChecker.isEmailVerified
      && permissionChecker.isEmptyPermissions
  ) {
    router.push({
      path: '/auth/empty-permissions',
    });
  }
}
