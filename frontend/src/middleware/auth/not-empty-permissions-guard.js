/**
 * Not Empty Permissions Guard
 *
 * This middleware runs before rendering any route that has meta.notEmptyPermissions = true
 *
 * It checks if currentUser has roles set (if not, redirects to /)
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
  if (!to.meta || !to.meta.notEmptyPermissions) {
    next()
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  if (
    store.getters['auth/signedIn'] &&
    store.getters['auth/roles'].length
  ) {
    return router.push('/')
  } else {
    next()
  }
}
