import { Filter } from '@/shared/modules/filters/types/FilterConfig';
import dayjs from 'dayjs';

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
      value: dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
      include: true,
    },
  } as Filter,
  limit: 20,
  lastActive: dayjs().toISOString(),
  savedFilterBody: {},
  conversations: [],
  totalConversations: 0,
} as ConversationState);
