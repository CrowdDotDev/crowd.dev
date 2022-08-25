/**
 * Email Already Verified Guard
 *
 * This middleware runs before rendering any route that has meta.emailAlreadyVerified = true
 *
 * It checks if the emailVerified attribute is set within our currentUser store object (if not, redirects to /)
 *
 * @param to
 * @param next
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({
  to,
  store,
  next,
  router
}) {
  if (!to.meta || !to.meta.emailAlreadyVerified) {
    next()
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  if (
    store.getters['auth/signedIn'] &&
    store.getters['auth/currentUser'].emailVerified
  ) {
    return router.push('/')
  } else {
    next()
  }
}
