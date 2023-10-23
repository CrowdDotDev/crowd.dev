import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const mostMembers: SavedView = {
  id: 'most-contacts',
  name: 'Most contacts',
  visibility: 'tenant',
  placement: 'organization',
  config: {
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
