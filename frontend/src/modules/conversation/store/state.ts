import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import moment from 'moment';

export interface ConversationState {
  filters: Filter,
  savedFilterBody: any,
  conversations: [],
  totalConversations: number
  limit: number,
  lastActive: string,
}

export default () => ({
  filters: {
    search: '',
    relation: 'and',
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
    lastActivityDate: {
      operator: 'gt',
      value: moment().subtract(7, 'day').format('YYYY-MM-DD'),
      include: true,
    },
  } as Filter,
  limit: 20,
  lastActive: moment().toISOString(),
  savedFilterBody: {},
  conversations: [],
  totalConversations: 0,
} as ConversationState);
