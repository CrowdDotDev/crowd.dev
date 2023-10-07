import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const allMembers: SavedView = {
  id: 'all-contacts',
  label: 'All contacts',
  filter: {
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

export default allMembers;
