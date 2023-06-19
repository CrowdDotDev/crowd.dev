import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const teamOrganizations: SavedView = {
  id: 'team-organizations',
  label: 'Team organizations',
  filter: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'filter',
    },
  },
};

export default teamOrganizations;
