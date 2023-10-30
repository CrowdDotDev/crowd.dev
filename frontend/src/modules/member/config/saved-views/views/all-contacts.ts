import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const allContacts: SavedView = {
  id: 'all-contacts',
  name: 'All contributors',
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
    },
  },
};

export default allContacts;
