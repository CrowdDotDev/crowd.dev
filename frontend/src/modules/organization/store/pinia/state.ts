import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import { Organization } from '@/modules/organization/types/Organization';

export interface OrganizationState {
  filters: Filter,
  savedFilterBody: any,
  organizations: Organization[];
  selectedOrganizations: Organization[];
  totalOrganizations: number;
}

const state: OrganizationState = {
  filters: {
    search: '',
    relation: 'and',
    pagination: {
      page: 1,
      perPage: 20,
    },
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
  } as Filter,
  savedFilterBody: {},
  organizations: [],
  selectedOrganizations: [],
  totalOrganizations: 0,
};

export default () => state;
