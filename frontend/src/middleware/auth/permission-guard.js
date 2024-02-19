import { PermissionChecker } from '@/modules/user/permission-checker';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';

/**
 * Permission Guard
 *
 * This middleware runs before rendering any route that has meta.permission = true
 *
 * It checks if user has to.meta.permission within its permissions (if not, redirects to /403)
 *
 * @param to
 * @param store
 * @param router
 * @returns {Promise<*>}
 */
export default async function ({ to, store, router }) {
  if (!to.meta || !to.meta.permission) {
    return;
  }

  const authStore = useAuthStore();
  const { user, tenant } = storeToRefs(authStore);

  const permissionChecker = new PermissionChecker(
    tenant.value,
    user.value,
  );

  console.log(permissionChecker);

  if (
    !permissionChecker.match(to.meta.permission)
    || permissionChecker.lockedForSampleData(
      to.meta.permission,
    )
  ) {
    router.push('/403');
  }
}
