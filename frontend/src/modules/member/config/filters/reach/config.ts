import {
  NumberFilterConfig,
  NumberFilterOptions,
  NumberFilterValue,
} from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const reach: NumberFilterConfig = {
  id: 'reach',
  label: 'Reach',
  iconClass: 'ri-parent-line',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value: NumberFilterValue, options: NumberFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.NUMBER]('Reach', value, options);
  },
  apiFilterRenderer(value: NumberFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.NUMBER]('reach', value);
  },
};

export default reach;
