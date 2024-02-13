import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOptions, MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { MemberService } from '@/modules/member/member-service';
import { DEFAULT_MEMBER_FILTERS } from '@/modules/member/store/constants';
import { Member } from '@/modules/member/types/Member';

const member: MultiSelectAsyncFilterConfig = {
  id: 'member',
  label: 'Contributor',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => MemberService.listAutocomplete({
      filter: {
        and: [
          {
            displayName: {
              textContains: query,
            },
          },
          {
            isOrganization: {
              not: true,
            },
          },
        ],
      },
      orderBy: 'displayName_ASC',
      offset: 0,
      limit: 10,
    })
      .then((data: {
        rows: Member[]
      }) => data.rows.map((member) => ({
        label: member.displayName,
        value: member.id,
      }))),
    remotePopulateItems: (ids: string[]) => MemberService.listMembers({
      filter: {
        and: [
          ...DEFAULT_MEMBER_FILTERS,
          {
            id: { in: ids },
          },
        ],
      },
      orderBy: null,
      limit: ids.length,
      offset: 0,
    })
      .then(({ rows }: any) => rows.map((member: any) => ({
        label: member.displayName,
        value: member.id,
      }))),
  },
  itemLabelRenderer(value: MultiSelectAsyncFilterValue, options: MultiSelectAsyncFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT_ASYNC]('Contributor', value, options, data);
  },
  apiFilterRenderer({ value, include }: MultiSelectAsyncFilterValue): any[] {
    const filter = {
      memberId: { in: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default member;
