import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import { MemberService } from '@/modules/member/member-service';

const member: MultiSelectFilterConfig = {
  id: 'member',
  label: 'Member',
  iconClass: 'ri-account-circle-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    remote: true,
    remoteMethod: (query) => MemberService.listAutocomplete(query, 10)
      .then((data: any[]) => data.map((member) => ({
        label: member.label,
        value: member.id,
      }))),
    remotePopulateItems: (ids: string[]) => MemberService.list({
      id: { in: ids },
    }, null, ids.length, 0, false)
      .then(({ rows }: any) => rows.map((member: any) => ({
        label: member.displayName,
        value: member.id,
      }))),
    options: [],
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Member', value, options);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('member', value);
  },
};

export default member;
