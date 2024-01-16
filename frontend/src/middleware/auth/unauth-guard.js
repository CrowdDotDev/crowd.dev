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
export default async function ({ to, router }) {
  if (!to.meta || !to.meta.unauth) {
    return;
  }

  const token = AuthToken.get();
  const tenantId = AuthCurrentTenant.get();

  if (token && tenantId) {
    // `window.history.replaceState` to replace the current URL with the root URL
    window.history.replaceState(null, '', '/');

    // `window.history.pushState` to add the root URL to the history stack
    window.history.pushState(null, '', '/');

    router.push('/');
  }
}
