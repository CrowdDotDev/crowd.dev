import { PermissionChecker } from '@/premium/user/permission-checker'

/**
 * Permission Guard
 *
 * This middleware runs before rendering any route that has meta.permission = true
 *
 * It checks if currentUser has to.meta.permission within its permissions (if not, redirects to /403)
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
  if (!to.meta || !to.meta.permission) {
    next()
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  if (
    new PermissionChecker(
      store.getters['auth/currentTenant'],
      store.getters['auth/currentUser']
    ).match(to.meta.permission)
  ) {
    next()
  } else {
    return router.push('/403')
  }
}
