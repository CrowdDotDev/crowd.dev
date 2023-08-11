import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import moment from 'moment';

export interface ConversationState {
  filters: Filter,
  savedFilterBody: any,
  conversations: [],
  totalConversations: number
  pagination: {
    page: number,
    perPage: number
  }
}

export default () => ({
  filters: {
    search: '',
    relation: 'and',
    order: {
      prop: 'activityCount',
      order: 'descending',
    },
    lastActivityDate: {
      operator: 'gt',
      value: moment().subtract(7, 'day').format('YYYY-MM-DD'),
      include: true,
    },
  } as Filter,
  pagination: {
    page: 1,
    perPage: 20,
  },
  savedFilterBody: {},
  conversations: [],
  totalConversations: 0,
} as ConversationState);
