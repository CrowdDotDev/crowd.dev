/**
 * Unauth Guard
 *
 * This middleware runs before rendering any route that has meta.unauth = true
 *
 * It checks if currentUser is undefined (if not, redirects to /)
 *
 * @param to
 * @param next
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({
  to,
  next,
  store,
  router
}) {
  if (!to.meta || !to.meta.unauth) {
    next()
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  if (store.getters['auth/signedIn']) {
    return router.push('/')
  } else {
    next()
  }
}
