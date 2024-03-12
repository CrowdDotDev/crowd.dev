import { PermissionChecker } from '@/modules/user/permission-checker';
import config from '@/config';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import { Auth0Service } from '@/shared/services/auth0.service';
import { AuthToken } from '@/modules/auth/auth-token';

function isGoingToIntegrationsPage(to) {
  return to.name === 'integration';
}

/**
 * Auth Guard
 *
 * This middleware runs before rendering any route that has meta.auth = true
 *
 * It uses the PermissionChecker to validate if:
 * - User is authenticated, and both currentTenant & currentUser exist within our store (if not, redirects to /auth/signup)
 * - Email of that user is verified (if not, redirects to /auth/email-unverified)
 * - User is onboarded (if not, redirects to /onboard)
 * - User has permissions (if not, redirects to /auth/empty-permissions)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */

async function handleAuth(store) {
  const storedToken = AuthToken.get();
  if (storedToken) {
    await store.dispatch('auth/doInit', storedToken);
    await store.dispatch('auth/doAuthenticate');
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const myJwt = params.get('my-jwt');
  if (myJwt) {
    AuthToken.set(myJwt, true);
    await store.dispatch('auth/doInit', myJwt);
    await store.dispatch('auth/doAuthenticate');
    return;
  }

  await Auth0Service.init();
}

export default async function ({
  to, from, store, router,
}) {
  if (!to.meta || !to.meta.auth) {
    return;
  }

  if (!store.getters['auth/isAuthenticated']) {
    if (config.env === 'production') {
      await Auth0Service.init();
    } else {
      await handleAuth(store);
    }
  }

  await store.dispatch('auth/doWaitUntilInit');

  const currentUser = store.getters['auth/currentUser'];

  const permissionChecker = new PermissionChecker(
    store.getters['auth/currentTenant'],
    currentUser,
  );

  // Temporary fix
  if (
    to.meta.permission
    && (!permissionChecker.match(to.meta.permission)
      || permissionChecker.lockedForSampleData(to.meta.permission))
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

  if (to.meta.notEmptyPermissions && !permissionChecker.isEmptyPermissions) {
    router.push({
      path: '/',
    });
  }
}
