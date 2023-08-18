import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { Member } from '@/modules/member/types/Member';
import allMembers from '@/modules/member/config/saved-views/views/all-members';
import { FilterCustomAttribute } from '@/shared/modules/filters/types/FilterCustomAttribute';

export interface MemberState {
  filters: Filter,
  savedFilterBody: any,
  customAttributes: FilterCustomAttribute[],
  customAttributesFilter: Record<string, FilterConfig>,
  members: Member[];
  selectedMembers: Member[];
  totalMembers: number;
}

const state: MemberState = {
  filters: {
    ...allMembers.filter,
  },
  savedFilterBody: {},
  customAttributes: [],
  customAttributesFilter: {},
  members: [],
  totalMembers: 0,
  selectedMembers: [],
};

export default () => state;
