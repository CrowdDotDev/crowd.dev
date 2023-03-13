import { PermissionChecker } from '@/modules/user/permission-checker'

/**
 * Permission Guard
 *
 * This middleware runs before rendering any route that has meta.permission = true
 *
 * It checks if currentUser has to.meta.permission within its permissions (if not, redirects to /403)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({ to, store, router }) {
  if (!to.meta || !to.meta.permission) {
    return
  }

  await store.dispatch('auth/doWaitUntilInit')

  const permissionChecker = new PermissionChecker(
    store.getters['auth/currentTenant'],
    store.getters['auth/currentUser']
  )

  if (
    !permissionChecker.match(to.meta.permission) ||
    permissionChecker.lockedForSampleData(
      to.meta.permission
    )
  ) {
    return router.push('/403')
  }
}
