import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const toReview: SavedView = {
  id: 'to-review',
  name: 'To review',
  placement: 'member',
  visibility: 'tenant',
  config: {
    search: '',
    relation: 'and',
    order: {
      prop: 'activityCount',
      order: 'descending',
    },
    settings: {
      teamMember: 'include',
      organization: 'exclude',
    },
    reviewed: {
      value: false,
    },
    enrichedMember: {
      value: true,
    },
  },
};

export default toReview;
