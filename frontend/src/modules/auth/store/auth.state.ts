import { User } from '@/modules/auth/types/User.type';
import { Tenant } from '@/modules/auth/types/Tenant.type';

export interface AuthState {
  token: string | null,
  user: User | null,
  tenant: Tenant | null,
}

export default () => ({
  user: null,
  tenant: null,
} as AuthState);
