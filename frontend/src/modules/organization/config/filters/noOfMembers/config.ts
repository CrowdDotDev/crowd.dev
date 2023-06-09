import {
  NumberFilterConfig,
  NumberFilterOptions,
  NumberFilterValue,
} from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import { FilterNumberOperator } from '@/shared/modules/filters/config/constants/number.constants';

const noOfMembers: NumberFilterConfig = {
  id: 'noOfMembers',
  label: '# of members',
  iconClass: 'ri-group-2-line',
  type: FilterConfigType.NUMBER,
  options: {
    forceOperator: FilterNumberOperator.BETWEEN,
  },
  itemLabelRenderer(value: NumberFilterValue, options: NumberFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.NUMBER]('# of members', value, options);
  },
  apiFilterRenderer(value: NumberFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.NUMBER]('memberCount', value);
  },
};

export default noOfMembers;
