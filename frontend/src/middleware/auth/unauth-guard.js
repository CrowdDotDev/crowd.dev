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
export default async function ({ to, store, router }) {
  if (!to.meta || !to.meta.unauth) {
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  if (store.getters['auth/signedIn']) {
    return router.push('/')
  }
}
