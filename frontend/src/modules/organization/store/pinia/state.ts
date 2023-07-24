import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import { Organization } from '@/modules/organization/types/Organization';
import allOrganizations from '@/modules/organization/config/saved-views/views/all-organizations';

export interface OrganizationState {
  filters: Filter,
  savedFilterBody: any,
  organizations: Organization[];
  organization: Organization | null;
  selectedOrganizations: Organization[];
  totalOrganizations: number;
}

const state: OrganizationState = {
  filters: {
    ...allOrganizations.filter,
    pagination: {
      page: 1,
      perPage: 20,
    },
  },
  savedFilterBody: {},
  organizations: [],
  organization: null,
  selectedOrganizations: [],
  totalOrganizations: 0,
};

export default () => state;
