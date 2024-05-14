import Message from '@/shared/message/message';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { useAuthStore } from '@/modules/auth/store/auth.store';

export const PermissionGuard = (permission: LfPermission) => async (to, from, next) => {
  // Ensure user is loaded
  const { ensureLoaded } = useAuthStore();
  await ensureLoaded();

  const { hasPermission } = usePermissions();
  if (hasPermission(permission)) {
    next();
    return true;
  }
  Message.error('You don\'t have access to this page');
  if (from.matched.length === 0) {
    next('/');
  }
  return false;
};
