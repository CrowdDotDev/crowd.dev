import { LfRole } from '@/shared/modules/permissions/types/Roles';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { User } from '@/modules/auth/types/User.type';
import config from '@/config';
import readonly from './readonly';
import admin from './admin';
import projectAdmin from './projectAdmin';

export const lfPermissions: Record<LfRole, Record<LfPermission, boolean>> = {
  readonly,
  admin,
  projectAdmin,
};

const teamUsers: string[] = (config.permissions.teamUserIds || '').split(',');

export const isTeamUser = (user: User | null) => user && teamUsers.includes(user.id);
