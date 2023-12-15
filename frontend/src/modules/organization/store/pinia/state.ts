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
  mergedOrganizations: {
    [key: string]: string;
  }
}

const state: OrganizationState = {
  filters: {
    ...allOrganizations.config,
  },
  savedFilterBody: {},
  organizations: [],
  organization: null,
  selectedOrganizations: [],
  totalOrganizations: 0,
  mergedOrganizations: {},
};

export default () => state;
