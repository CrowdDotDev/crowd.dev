import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import moment from 'moment';

const newAndActive: SavedView = {
  id: 'new-and-active',
  name: 'New and active',
  visibility: 'tenant',
  placement: 'organization',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'joinedAt',
      order: 'descending',
    },
    settings: {
      teamOrganization: 'exclude',
    },

    joinedDate: {
      operator: 'gt',
      value: moment().subtract(1, 'month').format('YYYY-MM-DD'),
    },
  },
};

export default newAndActive;
