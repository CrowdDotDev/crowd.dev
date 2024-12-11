export enum UserRole {
  admin = 'admin',
  projectAdmin = 'projectAdmin',
  readonly = 'readonly',
}
export interface UserModel {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  adminSegments: string[];
}
