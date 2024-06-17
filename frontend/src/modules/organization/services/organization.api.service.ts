import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { Organization } from '@/modules/organization/types/Organization';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';

export class OrganizationApiService {
  static async find(id: string, segments: string[]): Promise<Organization> {
    const tenantId = AuthService.getTenantId();

    const [segmentId] = segments;

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/${id}`,
      {
        params: {
          segmentId,
        },
      },
    );

    return response.data;
  }

  static async fetchMergeSuggestions(limit: number = 20, offset: number = 0, query: any = {}) {
    const tenantId = AuthService.getTenantId();
    const lsSegmentsStore = useLfSegmentsStore();
    const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

    const segments = [
      ...getSegmentsFromProjectGroup(selectedProjectGroup.value),
      selectedProjectGroup.value?.id,
    ];

    const data = {
      limit,
      offset,
      segments,
      ...query,
    };

    return authAxios.post(
      `/tenant/${tenantId}/organizationsToMerge`,
      data,
    )
      .then(({ data }) => Promise.resolve(data));
  }
}
