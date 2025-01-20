import { AuthState } from '@/modules/auth/store/auth.state';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import { TenantUser } from '@/modules/auth/types/TenantUser.type';
import { Tenant } from '@/modules/auth/types/Tenant.type';

export default {
  tenantUser: (state: AuthState): TenantUser => (state.user?.tenants || [])?.[0] || null,
  tenant: (state: AuthState): Tenant => (state.tenantUser?.tenant || null),
  roles: (state: AuthState): LfRole[] => state.tenantUser?.roles || [LfRole.readonly],
  isEmailVerified: (state: AuthState): boolean => {
    if (!state.user || !state.user.id) {
      return false;
    }
    return state.user.emailVerified;
  },
};
