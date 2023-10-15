import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const mostMembers: SavedView = {
  id: 'most-contacts',
  label: 'Most contacts',
  filter: {
    search: '',
    relation: 'and',
    order: {
      prop: 'memberCount',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'exclude',
    },
  },
};

export default mostMembers;
