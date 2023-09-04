import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const allOrganizations: SavedView = {
  id: 'all-organizations',
  label: 'All organizations',
  filter: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'exclude',
    },
  },
};

export default allOrganizations;
