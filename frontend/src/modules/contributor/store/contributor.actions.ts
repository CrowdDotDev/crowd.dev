import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { ContributorApiService } from '@/modules/contributor/services/contributor.api.service';
import { Contributor } from '@/modules/contributor/types/Contributor';

export default {
  getContributor(id: string): Promise<Contributor> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorApiService.find(id, [selectedProjectGroup.value?.id as string])
      .then((contributor) => {
        this.contributor = contributor;
        return Promise.resolve(contributor);
      });
  },
  updateContributor(id: string, data: Partial<Contributor>) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorApiService.update(id, data, [selectedProjectGroup.value?.id as string])
      .then((contributor) => {
        this.contributor = contributor;
        return Promise.resolve(contributor);
      });
  },
};
