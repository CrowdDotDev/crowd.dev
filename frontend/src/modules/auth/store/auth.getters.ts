import { AuthState } from '@/modules/auth/store/auth.state';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import { TenantUser } from '@/modules/auth/types/TenantUser.type';

export default {
  tenantUser: (state: AuthState): TenantUser => (state.user?.tenants || []).find((t) => t.tenantId === tenantId),
  roles: (state: AuthState): LfRole[] => state.tenantUser?.roles || [LfRole.readonly],
  isEmailVerified: (state: AuthState): boolean => {
    if (!state.user || !state.user.id) {
      return false;
    }
    return state.user.emailVerified;
  },
};
