import {
  Filter,
  FilterConfig,
} from '@/shared/modules/filters/types/FilterConfig';
import { Member } from '@/modules/member/types/Member';
import allMembers from '@/modules/member/config/saved-views/views/all-members';
import { FilterCustomAttribute } from '@/shared/modules/filters/types/FilterCustomAttribute';

export interface MemberState {
  filters: Filter;
  savedFilterBody: any;
  customAttributes: FilterCustomAttribute[];
  customAttributesFilter: Record<string, FilterConfig>;
  members: Member[];
  selectedMembers: Member[];
  totalMembers: number;
  toMergeMember: {
    id: string;
    segmentId: string;
  } | null;
}

const state: MemberState = {
  filters: {
    ...allMembers.config,
  },
  savedFilterBody: {},
  customAttributes: [],
  customAttributesFilter: {},
  members: [],
  totalMembers: 0,
  selectedMembers: [],
  toMergeMember: null,
};

export default () => state;
