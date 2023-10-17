import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import moment from 'moment';

const slippingAway: SavedView = {
  id: 'slipping-away',
  name: 'Slipping away',
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

    engagementLevel: {
      value: ['fan', 'ultra'],
      include: true,
    },

    lastActivityDate: {
      operator: 'lt',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
    },
  },
};

export default slippingAway;
