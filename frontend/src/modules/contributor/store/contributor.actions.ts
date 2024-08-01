import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { ContributorApiService } from '@/modules/contributor/services/contributor.api.service';
import { Contributor } from '@/modules/contributor/types/Contributor';
import { MergeActionsService } from '@/shared/modules/merge/services/merge-actions.service';
import { MergeAction } from '@/shared/modules/merge/types/MemberActions';

export default {
  getContributor(id: string): Promise<Contributor> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

    return ContributorApiService.find(id, [selectedProjectGroup.value?.id as string])
      .then((contributor) => {
        this.contributor = contributor;
        this.getContributorMergeActions(id);
        return Promise.resolve(contributor);
      });
  },
  getContributorMergeActions(id: string): Promise<MergeAction[]> {
    return MergeActionsService.list(id)
      .then((mergeActions) => {
        const inProgress = mergeActions.some((action) => action.state === 'in-progress');
        const error = mergeActions.some((action) => action.state === 'error');
        this.contributor = {
          ...this.contributor,
          // eslint-disable-next-line no-nested-ternary
          activitySycning: inProgress ? 'in-progress' : (error ? 'error' : ''),
        };
        return Promise.resolve(mergeActions);
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
