import { LfPermission } from '@/shared/modules/permissions/types/Permissions';

const projectAdmin: Record<LfPermission, boolean> = {
  [LfPermission.tenantEdit]: true,
};

export default projectAdmin;
