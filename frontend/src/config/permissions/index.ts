import { LfRole } from '@/shared/modules/permissions/types/Roles';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import { User } from '@/modules/auth/types/User.type';
import readonly from './readonly';
import admin from './admin';
import projectAdmin from './projectAdmin';

export const lfPermissions: Record<LfRole, Record<LfPermission, boolean>> = {
  readonly,
  admin,
  projectAdmin,
};

const teamUsers: string[] = [
  'fc795a2e-9bd6-4b2d-817b-c357d1d59a2a',
  'df7f38f0-e994-4954-b680-edd9930a2e02',
  '5418959c-7410-40a8-bce7-a3635291bd29',
  'f1004da4-f99c-4a9d-b718-6447128d961d',
  'af964295-bc82-436c-8cce-843cd0a6b2ef',
  'a9745d27-1d2e-4f6f-adda-aeb7c9553cbb',
  'd2e45678-b867-4a14-950a-b6f72319d44b',
  '208c0a98-6290-42c5-a1a4-b2ec3451d97b',
  '10cc0c77-2ed8-487d-9e40-688a46786fe5',
  '5e127804-4382-4648-bed7-12c34846d5ce',
  '893c09e1-8f33-4464-80fe-9db431d82ba3',
  'cbc5ec8f-76c2-49f0-8288-c61c5c238d6d',
  '815a59ef-bb99-42ea-b6b8-fe30a1c1e2e1',
  // '0fbf4c1b-3774-4a7a-a126-7a722ed8ff93',
];

export const isTeamUser = (user: User | null) => user && teamUsers.includes(user.id);
