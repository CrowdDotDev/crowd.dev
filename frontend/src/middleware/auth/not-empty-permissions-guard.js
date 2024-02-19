/**
 * Not Empty Permissions Guard
 *
 * This middleware runs before rendering any route that has meta.notEmptyPermissions = true
 *
 * It checks if user has roles set (if not, redirects to /)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({ to, store, router }) {
  if (!to.meta || !to.meta.notEmptyPermissions) {
    return;
  }

  if (
    store.getters['auth/signedIn']
    && store.getters['auth/roles'].length
  ) {
    router.push('/');
  }
}
