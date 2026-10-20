import type { AuthState } from '@/modules/auth/store/auth.state';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import type { TenantUser } from '@/modules/auth/types/TenantUser.type';
import type { Tenant } from '@/modules/auth/types/Tenant.type';

export default {
  tenantUser: (state: AuthState): TenantUser | null => (state.user?.tenants || [])?.[0] || null,
  tenant(this: { tenantUser: TenantUser | null }): Tenant | null {
    return this.tenantUser?.tenant || null;
  },
  roles(this: { tenantUser: TenantUser | null }): LfRole[] {
    return this.tenantUser?.roles || [LfRole.readonly];
  },
  isEmailVerified: (state: AuthState): boolean => {
    if (!state.user || !state.user.id) {
      return false;
    }
    return state.user.emailVerified;
  },
};
