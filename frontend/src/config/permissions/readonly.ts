import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const readonly: Record<LfPermission, boolean> = {
  [LfPermission.tenantEdit]: false,
};

export default readonly;
