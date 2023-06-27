import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const influential: SavedView = {
  id: 'influential',
  label: 'Influential',
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

    reach: {
      operator: 'gte',
      value: 500,
    },
  },
};

export default influential;
