import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import moment from 'moment';

export interface ConversationState {
  filters: Filter,
  savedFilterBody: any,
  conversations: [],
  totalConversations: number
}

export default () => ({
  filters: {
    search: '',
    relation: 'and',
    pagination: {
      page: 1,
      perPage: 20,
    },
    order: {
      prop: 'timestamp',
      order: 'descending',
    },
    lastActivityDate: {
      operator: 'gt',
      value: moment().subtract(7, 'day').format('YYYY-MM-DD'),
      include: true,
    },
  } as Filter,
  savedFilterBody: {},
  conversations: [],
  totalConversations: 0,
} as ConversationState);
