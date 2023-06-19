import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import moment from 'moment';

const slippingAway: SavedView = {
  id: 'slipping-away',
  label: 'Slipping away',
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

    lastActivityDate: {
      operator: 'gt',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
      include: true,
    },
  },
};

export default slippingAway;
