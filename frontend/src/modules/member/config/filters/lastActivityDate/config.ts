import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { DateFilterConfig, DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const lastActivityDate: DateFilterConfig = {
  id: 'lastActivityDate',
  label: 'Last activity date',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value: DateFilterValue): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('Last activity date', value);
  },
  apiFilterRenderer(value: DateFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.BOOLEAN]('lastActive', value);
  },
};

export default lastActivityDate;
