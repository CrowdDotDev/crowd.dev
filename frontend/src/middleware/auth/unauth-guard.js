import { AuthToken } from '@/modules/auth/auth-token';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

/**
 * Unauth Guard
 *
 * This middleware runs before rendering any route that has meta.unauth = true
 *
 * It checks if currentUser is undefined (if not, redirects to /)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default function ({ to, router }) {
  if (!to.meta || !to.meta.unauth) {
    return;
  }

  const token = AuthToken.get();
  const tenantId = AuthCurrentTenant.get();

  if (token && tenantId) {
    router.push('/');
  }
}
