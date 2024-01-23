import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const allContacts: SavedView = {
  id: 'all-contacts',
  name: 'All contacts',
  placement: 'member',
  visibility: 'tenant',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'exclude',
      organization: 'exclude',
      deleted: 'exclude',
    },
  },
};

export default allContacts;
