import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import { dateHelper } from '@/shared/date-helper/date-helper';

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
      value: dateHelper().subtract(7, 'day').format('YYYY-MM-DD'),
      include: true,
    },
  } as Filter,
  limit: 20,
  lastActive: dateHelper().toISOString(),
  savedFilterBody: {},
  conversations: [],
  totalConversations: 0,
} as ConversationState);
