import { PermissionChecker } from '@/premium/user/permission-checker'

/**
 * Not Empty Tenant Guard
 *
 * This middleware runs before rendering any route that has meta.notEmptyTenant = true
 *
 * It checks if:
 * - currentUser is authenticated (if not, redirects to /auth/signin)
 * - currentTenant is set (if not, redirects to /)
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
  if (!to.meta || !to.meta.notEmptyTenant) {
    next()
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  const permissionChecker = new PermissionChecker(
    store.getters['auth/currentTenant'],
    store.getters['auth/currentUser']
  )

  if (!permissionChecker.isAuthenticated) {
    return router.push('/auth/signin')
  }

  if (!permissionChecker.isEmptyTenant) {
    return router.push('/')
  }

  next()
}
