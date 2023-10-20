import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import moment from 'moment';

const newAndActive: SavedView = {
  id: 'new-and-active',
  name: 'New and active',
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

    joinedDate: {
      operator: 'gt',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
    },

    lastActivityDate: {
      operator: 'gt',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
    },
  },
};

export default newAndActive;
