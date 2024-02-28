import { PermissionChecker } from '@/modules/user/permission-checker';
import config from '@/config';
import { tenantSubdomain } from '@/modules/tenant/tenant-subdomain';
import { Auth0Service } from '@/modules/auth/services/auth0.service';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

function isGoingToIntegrationsPage(to) {
  return to.name === 'integration';
}

/**
 * Auth Guard
 *
 * This middleware runs before rendering any route that has meta.auth = true
 *
 * It uses the PermissionChecker to validate if:
 * - User is authenticated, and both tenant & ser exist within our store (if not, redirects to /auth/signup)
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
  to, router,
}) {
  if (!to.meta || !to.meta.auth) {
    return;
  }
  const authStore = useAuthStore();
  const { ensureLoaded } = authStore;
  const { user, tenant } = storeToRefs(authStore);
  await ensureLoaded();

  const permissionChecker = new PermissionChecker(
    tenant.value,
    user.value,
  );

  if (
    to.meta.permission
    && (!permissionChecker.match(to.meta.permission))
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
