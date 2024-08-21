import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { MergeAction } from '@/shared/modules/merge/types/MemberActions';

export class MergeActionsService {
  static async list(entityId: string, type: string = 'member', limit = 1): Promise<MergeAction[]> {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/mergeActions`,
      {
        params: {
          entityId,
          type,
          limit,
        },
      },
    );

    return response.data;
  }
}
