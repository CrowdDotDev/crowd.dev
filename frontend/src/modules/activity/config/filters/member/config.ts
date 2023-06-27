import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import {
  MultiSelectAsyncFilterConfig,
  MultiSelectAsyncFilterOptions, MultiSelectAsyncFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectAsyncFilterConfig';
import { MemberService } from '@/modules/member/member-service';

const member: MultiSelectAsyncFilterConfig = {
  id: 'member',
  label: 'Contributor',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.MULTISELECT_ASYNC,
  options: {
    remoteMethod: (query) => MemberService.listAutocomplete({
      query,
      limit: 10,
    })
      .then((data: any[]) => data.map((member) => ({
        label: member.label,
        value: member.id,
      }))),
    remotePopulateItems: (ids: string[]) => MemberService.list({
      customFilters: {
        id: { in: ids },
      },
      orderBy: null,
      limit: ids.length,
      offset: 0,
      buildFilter: false,
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
      memberId: value,
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default member;
