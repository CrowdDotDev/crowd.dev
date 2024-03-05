import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  DateFilterConfig,
  DateFilterOptions,
  DateFilterValue,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const actionDate: DateFilterConfig = {
  id: 'actionDate',
  label: 'Action date',
  iconClass: 'ri-calendar-2-line',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value: DateFilterValue, options: DateFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.DATE]('Action date', value, options);
  },
  apiFilterRenderer(value: DateFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.DATE]('actionDate', value);
  },
};

export default actionDate;
