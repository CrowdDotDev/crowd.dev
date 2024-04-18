import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const admin: Record<LfPermission, boolean> = {
  [LfPermission.tenantEdit]: true,
};

export default admin;
