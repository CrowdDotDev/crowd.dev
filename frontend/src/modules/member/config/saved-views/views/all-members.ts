import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const allMembers: SavedView = {
  id: 'all-contacts',
  label: 'All contributors',
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
