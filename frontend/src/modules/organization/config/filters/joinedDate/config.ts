import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  DateFilterConfig,
  DateFilterOptions,
  DateFilterValue,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const joinedDate: DateFilterConfig = {
  id: 'joinedDate',
  label: 'Joined date',
  iconClass: 'ri-calendar-event-line',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value: DateFilterValue, options: DateFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.DATE]('Joined date', value, options);
  },
  apiFilterRenderer(value: DateFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.DATE]('joinedAt', value);
  },
};

export default joinedDate;
