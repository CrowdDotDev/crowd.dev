import { Pagination } from '@/shared/types/Pagination';
import { OrganizationState } from '@/modules/organization/store/pinia/state';
import { Organization } from '@/modules/organization/types/Organization';
import { OrganizationService } from '@/modules/organization/organization-service';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

export default {
  fetchOrganizations(this: OrganizationState, { body = {}, reload = false } :{ body?: any, reload?: boolean }): Promise<Pagination<Organization>> {
    const mappedBody = reload ? { ...this.savedFilterBody, ...body } : body;
    this.selectedOrganizations = [];
    return OrganizationService.query(mappedBody)
      .then((data: Pagination<Organization>) => {
        this.organizations = data.rows;
        this.totalOrganizations = data.count;
        this.savedFilterBody = mappedBody;
        return Promise.resolve(data);
      })
      .catch((err: Error) => {
        this.organizations = [];
        this.totalOrganizations = 0;
        return Promise.reject(err);
      });
  },
  fetchOrganization(id: string): Promise<Organization> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return OrganizationService.find(id, [selectedProjectGroup.value?.id as string])
      .then((organization: Organization) => {
        this.organization = organization;
        return Promise.resolve(organization);
      });
  },
  updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());
    return OrganizationService.update(id, data, [selectedProjectGroup.value?.id as string])
      .then((organization: Organization) => {
        this.organization = organization;
        return this.fetchOrganization(id);
      });
  },
  addMergedOrganizations(this: OrganizationState, primaryId: string, secondaryId: string) {
    this.mergedOrganizations[primaryId] = secondaryId;
  },

  removeMergedOrganizations(this: OrganizationState, primaryId: string) {
    delete this.mergedOrganizations[primaryId];
  },

  addToMergeOrganizations(this: OrganizationState, originalId: string, toMergeId: string) {
    this.toMergeOrganizations.originalId = originalId;
    this.toMergeOrganizations.toMergeId = toMergeId;
  },

  removeToMergeOrganizations(this: OrganizationState) {
    this.toMergeOrganizations = {
      originalId: null,
      toMergeId: null,
    };
  },
};
