import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { storeToRefs } from 'pinia';
import { ContributorApiService } from '@/modules/contributor/services/contributor.api.service';
import type {
  Contributor,
  ContributorAffiliation,
  ContributorIdentity,
  CreateContributorIdentity,
  UpdateContributorIdentityPayload,
} from '@/modules/contributor/types/Contributor';
import { ContributorIdentitiesApiService } from '@/modules/contributor/services/contributor.identities.api.service';
import { MergeActionsService } from '@/shared/modules/merge/services/merge-actions.service';
import type { MergeAction } from '@/shared/modules/merge/types/MemberActions';
import type { MemberOrganization, Organization } from '@/modules/organization/types/Organization';
import { ContributorOrganizationsApiService } from '@/modules/contributor/services/contributor.organizations.api.service';
import { ContributorAffiliationsApiService } from '@/modules/contributor/services/contributor.affiliations.api.service';
import { ContributorAttributesApiService } from '@/modules/contributor/services/contributor.attributes.api.service';
import type { ContributorState } from '@/modules/contributor/store/contributor.state';

// shortcut: casts keep the spread of a possibly null contributor. revisit: when CM-1569 lands the setup store
type ContributorStore = ContributorState & {
  getContributorIdentities(id: string): Promise<ContributorIdentity[]>;
  getContributorOrganizations(memberId: string): Promise<Organization[]>;
  getContributorAttributes(memberId: string): Promise<any>;
  getContributorAffiliations(memberId: string): Promise<ContributorAffiliation[]>;
  getContributorMergeActions(id: string): Promise<MergeAction[]>;
  setIdentities(identities: ContributorIdentity[]): Promise<ContributorIdentity[]>;
  setOrganizations(organizations: Organization[]): Promise<Organization[]>;
  setAffiliations(affiliations: ContributorAffiliation[]): Promise<ContributorAffiliation[]>;
  setAttributes(attributes: any): Promise<any>;
};

const getPureContributor = (contributor: Contributor) =>
  Object.fromEntries(
    Object.entries(contributor).filter(
      ([key]) => !['attributes', 'affiliations', 'organizations', 'identities'].includes(key),
    ),
  );

export default {
  getContributor(id: string): Promise<Contributor> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    this.getContributorIdentities(id);
    this.getContributorOrganizations(id);
    this.getContributorAttributes(id);
    this.getContributorAffiliations(id);

    return ContributorApiService.find(id, [selectedProjectGroup.value?.id as string]).then(
      (contributor) => {
        this.contributor = {
          ...(this.contributor as Contributor),
          ...getPureContributor(contributor),
        };
        this.getContributorMergeActions(id);
        return Promise.resolve(this.contributor as Contributor);
      },
    );
  },
  getContributorMergeActions(id: string): Promise<MergeAction[]> {
    return MergeActionsService.list(id).then((mergeActions) => {
      this.contributor = {
        ...(this.contributor as Contributor),
        // eslint-disable-next-line no-nested-ternary
        activitySycning: mergeActions.length > 0 ? mergeActions[0] : null,
      };
      return Promise.resolve(mergeActions);
    });
  },
  updateContributor(id: string, data: Partial<Contributor>) {
    return ContributorApiService.update(id, data).then((contributor) => {
      this.contributor = {
        ...(this.contributor as Contributor),
        ...contributor,
      };
      return Promise.resolve(contributor);
    });
  },

  /** IDENTITIES * */
  setIdentities(identities: ContributorIdentity[]) {
    this.contributor = {
      ...(this.contributor as Contributor),
      identities,
    };
    return Promise.resolve(identities);
  },
  getContributorIdentities(id: string) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorIdentitiesApiService.list(id, [
      selectedProjectGroup.value?.id as string,
    ]).then(this.setIdentities);
  },
  createContributorIdentities(
    memberId: string,
    identities: CreateContributorIdentity[],
  ): Promise<ContributorIdentity[]> {
    return ContributorIdentitiesApiService.createMultiple(memberId, identities).then(
      this.setIdentities,
    );
  },
  updateContributorIdentity(
    memberId: string,
    id: string,
    identity: UpdateContributorIdentityPayload,
  ): Promise<ContributorIdentity[]> {
    return ContributorIdentitiesApiService.update(memberId, id, identity).then(this.setIdentities);
  },
  deleteContributorIdentity(memberId: string, id: string): Promise<ContributorIdentity[]> {
    return ContributorIdentitiesApiService.delete(memberId, id).then(this.setIdentities);
  },

  /** Organizations * */
  setOrganizations(organizations: Organization[]) {
    this.contributor = {
      ...(this.contributor as Contributor),
      organizations,
    };
    return Promise.resolve(organizations);
  },
  getContributorOrganizations(memberId: string) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorOrganizationsApiService.list(memberId, [
      selectedProjectGroup.value?.id as string,
    ]).then(this.setOrganizations);
  },
  createContributorOrganization(
    memberId: string,
    organization: Partial<MemberOrganization>,
  ): Promise<Organization[]> {
    return ContributorOrganizationsApiService.create(memberId, organization).then(
      this.setOrganizations,
    );
  },
  updateContributorOrganization(
    memberId: string,
    id: string,
    organization: Partial<MemberOrganization>,
  ): Promise<Organization[]> {
    return ContributorOrganizationsApiService.update(memberId, id, organization).then(
      this.setOrganizations,
    );
  },
  deleteContributorOrganization(memberId: string, id: string): Promise<Organization[]> {
    return ContributorOrganizationsApiService.delete(memberId, id).then(this.setOrganizations);
  },

  /** Affiliations * */
  setAffiliations(affiliations: ContributorAffiliation[]) {
    this.contributor = {
      ...(this.contributor as Contributor),
      affiliations,
    };
    return Promise.resolve(affiliations);
  },
  getContributorAffiliations(memberId: string) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorAffiliationsApiService.list(memberId, [
      selectedProjectGroup.value?.id as string,
    ]).then(this.setAffiliations);
  },

  updateContributorAffiliations(
    memberId: string,
    affiliations: Partial<ContributorAffiliation>[],
  ): Promise<ContributorAffiliation[]> {
    return ContributorAffiliationsApiService.updateMultiple(memberId, affiliations).then(
      this.setAffiliations,
    );
  },

  /** Attributes * */
  setAttributes(attributes: any) {
    this.contributor = {
      ...(this.contributor as Contributor),
      attributes,
    };
    return Promise.resolve(attributes);
  },
  getContributorAttributes(memberId: string) {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return ContributorAttributesApiService.list(memberId, [
      selectedProjectGroup.value?.id as string,
    ]).then(this.setAttributes);
  },
  updateContributorAttributes(memberId: string, attributes: any): Promise<Organization[]> {
    return ContributorAttributesApiService.update(memberId, attributes).then(this.setAttributes);
  },

  /** Report Data Modal * */
  setReportDataModal(data: any) {
    this.reportDataModal = data;
  },
} satisfies ThisType<ContributorStore>;
