import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import moment from 'moment';

const slippingAway: SavedView = {
  id: 'slipping-away',
  label: 'Slipping away',
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

    lastActivityDate: {
      operator: 'after',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
      exclude: false,
    },
  },
};

export default slippingAway;
