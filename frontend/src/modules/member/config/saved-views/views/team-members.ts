import { SavedView } from '@/shared/modules/saved-views/types/SavedViewsConfig';

const teamMembers: SavedView = {
  id: 'team-members',
  label: 'Team contributors',
  filter: {
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
