import authAxios from '@/shared/axios/auth-axios';
import { ContributorAffiliation } from '@/modules/contributor/types/Contributor';

export class ContributorAffiliationsApiService {
  static async list(memberId: string, segments: string[]): Promise<ContributorAffiliation[]> {
    return authAxios.get(
      `/member/${memberId}/affiliation`,
      {
        params: {
          segments,
        },
      },
    ).then(({ data }) => Promise.resolve(data));
  }

  static async updateMultiple(memberId: string, affiliations: Partial<ContributorAffiliation>[]): Promise<ContributorAffiliation[]> {
    return authAxios.patch(
      `/member/${memberId}/affiliation`,
      {
        affiliations,
      },
    ).then(({ data }) => Promise.resolve(data));
  }
}
