import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { ContributorApiService } from '@/modules/contributor/services/contributor.api.service';
import { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import { ContributorIdentitiesApiService } from '@/modules/contributor/services/contributor.identities.api.service';

export default {
  getContributor(id: string): Promise<Contributor> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorApiService.find(id, [selectedProjectGroup.value?.id as string])
      .then((contributor) => {
        this.contributor = {
          ...this.contributor,
          ...contributor,
        };
        return Promise.resolve(contributor);
      });
  },
  updateContributor(id: string, data: Partial<Contributor>) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorApiService.update(id, data, [selectedProjectGroup.value?.id as string])
      .then((contributor) => {
        this.contributor = {
          ...this.contributor,
          ...contributor,
        };
        return Promise.resolve(contributor);
      });
  },

  /** IDENTITIES * */
  setIdentities(identities: ContributorIdentity[]) {
    this.contributor = {
      ...this.contributor,
      identities,
    };
    return Promise.resolve(identities);
  },
  createContributorIdentities(memberId: string, identities: ContributorIdentity[]): Promise<ContributorIdentity[]> {
    return ContributorIdentitiesApiService.createMultiple(memberId, identities)
      .then(this.setIdentities);
  },
  updateContributorIdentity(memberId: string, id: string, identity: Partial<ContributorIdentity>): Promise<ContributorIdentity[]> {
    return ContributorIdentitiesApiService.update(memberId, id, identity)
      .then(this.setIdentities);
  },
  deleteContributorIdentity(memberId: string, id: string): Promise<ContributorIdentity[]> {
    return ContributorIdentitiesApiService.delete(memberId, id)
      .then(this.setIdentities);
  },
};
