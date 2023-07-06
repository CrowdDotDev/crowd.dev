import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOptions, MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { MemberService } from '@/modules/member/member-service';

const member: MultiSelectAsyncFilterConfig = {
  id: 'member',
  label: 'Member',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => MemberService.listAutocomplete(query, 10)
      .then((data: any[]) => data.map((member) => ({
        label: member.label,
        value: member.id,
      }))),
    remotePopulateItems: (ids: string[]) => MemberService.listMembers({
      filter: {
        id: { in: ids },
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
    return itemLabelRendererByType[FilterConfigType.MULTISELECT_ASYNC]('Member', value, options, data);
  },
  apiFilterRenderer({ value, include }: MultiSelectAsyncFilterValue): any[] {
    const filter = {
      memberId: value,
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default member;
