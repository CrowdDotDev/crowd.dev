import { AuthState } from '@/modules/auth/store/auth.state';
import { AuthService } from '@/modules/auth/services/auth.service';
import { LfRole } from '@/shared/modules/permissions/types/Roles';
import { TenantUser } from '@/modules/auth/types/TenantUser.type';

export default {
  tenantUser: (state: AuthState): TenantUser => {
    const tenantId = AuthService.getTenantId();
    return (state.user?.tenants || []).find((t) => t.tenantId === tenantId);
  },
  roles: (state: AuthState): LfRole[] => state.tenantUser.roles || [LfRole.readonly],
};
