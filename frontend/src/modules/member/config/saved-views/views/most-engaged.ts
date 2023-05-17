import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const mostEngaged: SavedView = {
  id: 'most-engaged',
  label: 'Most engaged',
  filter: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActivity',
      order: 'descending',
    },
    settings: {
      bot: 'exclude',
      teamMember: 'exclude',
      organization: 'exclude',
    },

    engagementLevel: {
      value: ['fan', 'ultra'],
      exclude: false,
    },
  },
};

export default mostEngaged;
