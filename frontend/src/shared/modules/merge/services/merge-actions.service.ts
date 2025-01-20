import authAxios from '@/shared/axios/auth-axios';
import { MergeAction } from '@/shared/modules/merge/types/MemberActions';

export class MergeActionsService {
  static async list(entityId: string, type: string = 'member', limit = 1): Promise<MergeAction[]> {
    const response = await authAxios.get(
      '/mergeActions',
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
