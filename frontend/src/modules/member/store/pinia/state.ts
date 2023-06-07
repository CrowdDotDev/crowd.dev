import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { Member } from '@/modules/member/types/Member';

export interface MemberState {
  filters: Filter,
  savedFilterBody: any,
  customAttributes: Record<string, FilterConfig>,
  members: Member[];
  selectedMembers: Member[];
  totalMembers: number;
}

const state: MemberState = {
  filters: {
    search: '',
    relation: 'and',
    pagination: {
      page: 1,
      perPage: 20,
    },
    order: {
      prop: 'lastActive',
      order: 'descending',
    },
  } as Filter,
  savedFilterBody: {},
  customAttributes: {},
  members: [],
  totalMembers: 0,
  selectedMembers: [],
};

export default () => state;
