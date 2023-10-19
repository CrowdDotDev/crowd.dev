import { Filter, FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import { Member } from '@/modules/member/types/Member';
import allContacts from '@/modules/member/config/saved-views/views/all-contacts';
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
    ...allContacts.config,
  },
  savedFilterBody: {},
  customAttributes: [],
  customAttributesFilter: {},
  members: [],
  totalMembers: 0,
  selectedMembers: [],
};

export default () => state;
