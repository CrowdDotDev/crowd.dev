import { Pagination } from '@/shared/types/Pagination';
import { OrganizationState } from '@/modules/organization/store/pinia/state';
import { Organization } from '@/modules/organization/types/Organization';
import { OrganizationService } from '@/modules/organization/organization-service';

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
  fetchOrganization(this: OrganizationState, id: string): Promise<Organization> {
    return OrganizationService.find(id)
      .then((organization: Organization) => {
        this.organization = organization;
        return Promise.resolve(organization);
      });
  },
};
