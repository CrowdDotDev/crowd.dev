import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  DateFilterConfig,
  DateFilterOptions,
  DateFilterValue,
} from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const lastActivityDate: DateFilterConfig = {
  id: 'lastActivityDate',
  label: 'Last activity',
  iconClass: 'calendar',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value: DateFilterValue, options: DateFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.DATE]('Last activity', value, options);
  },
  apiFilterRenderer(value: DateFilterValue): any[] {
    let { operator } = value;

    if (value.operator === 'gt') {
      operator = 'gte';
    } else if (value.operator === 'lt') {
      operator = 'lte';
    }

    return apiFilterRendererByType[FilterConfigType.DATE]('lastActive', {
      ...value,
      operator,
    });
  },
};

export default lastActivityDate;
