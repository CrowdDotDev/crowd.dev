import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const teamMembers: SavedView = {
  id: 'team-contacts',
  name: 'Team contacts',
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
      teamMember: 'filter',
      organization: 'exclude',
    },
  },
};

export default teamMembers;
