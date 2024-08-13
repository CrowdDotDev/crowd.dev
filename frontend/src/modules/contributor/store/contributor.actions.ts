import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { ContributorApiService } from '@/modules/contributor/services/contributor.api.service';
import { Contributor, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import { ContributorIdentitiesApiService } from '@/modules/contributor/services/contributor.identities.api.service';
import { MergeActionsService } from '@/shared/modules/merge/services/merge-actions.service';
import { MergeAction } from '@/shared/modules/merge/types/MemberActions';
import { MemberOrganization, Organization } from '@/modules/organization/types/Organization';
import { ContributorOrganizationsApiService } from '@/modules/contributor/services/contributor.organizations.api.service';

export default {
  getContributor(id: string): Promise<Contributor> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    this.getContributorIdentities(id);
    this.getContributorOrganizations(id);

    return ContributorApiService.find(id, [selectedProjectGroup.value?.id as string])
      .then((contributor) => {
        this.contributor = {
          ...this.contributor,
          ...contributor,
        };
        this.getContributorMergeActions(id);
        return Promise.resolve(contributor);
      });
  },
  getContributorMergeActions(id: string): Promise<MergeAction[]> {
    return MergeActionsService.list(id)
      .then((mergeActions) => {
        this.contributor = {
          ...this.contributor,
          // eslint-disable-next-line no-nested-ternary
          activitySycning: mergeActions.length > 0 ? mergeActions[0] : null,
        };
        return Promise.resolve(mergeActions);
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
  getContributorIdentities(id: string) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorIdentitiesApiService.list(id, [selectedProjectGroup.value?.id as string])
      .then(this.setIdentities);
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

  /** IDENTITIES * */
  setOrganizations(organizations: Organization[]) {
    this.contributor = {
      ...this.contributor,
      organizations,
    };
    return Promise.resolve(organizations);
  },
  getContributorOrganizations(memberId: string) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorOrganizationsApiService.list(memberId, [selectedProjectGroup.value?.id as string])
      .then(this.setOrganizations);
  },
  createContributorOrganization(memberId: string, organization: Partial<MemberOrganization>): Promise<Organization[]> {
    return ContributorOrganizationsApiService.create(memberId, organization)
      .then(this.setOrganizations);
  },
  updateContributorOrganization(memberId: string, id: string, organization: Partial<MemberOrganization>): Promise<Organization[]> {
    return ContributorOrganizationsApiService.update(memberId, id, organization)
      .then(this.setOrganizations);
  },
  deleteContributorOrganization(memberId: string, id: string): Promise<Organization[]> {
    return ContributorOrganizationsApiService.delete(memberId, id)
      .then(this.setOrganizations);
  },
};
