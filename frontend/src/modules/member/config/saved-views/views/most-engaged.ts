import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const mostEngaged: SavedView = {
  id: 'most-engaged',
  label: 'Most engaged',
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

    engagementLevel: {
      value: ['fan', 'ultra'],
      include: true,
    },
  },
};

export default mostEngaged;
