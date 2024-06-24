import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const allOrganizations: SavedView = {
  id: 'all-organizations',
  name: 'All organizations',
  visibility: 'tenant',
  placement: 'organization',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'activityCount',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'exclude',
    },
  },
};

export default allOrganizations;
