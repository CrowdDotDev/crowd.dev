import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { DateFilterConfig, DateFilterValue } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const joinedDate: DateFilterConfig = {
  id: 'joinedDate',
  label: 'Joined date',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value: DateFilterValue): string {
    return itemLabelRendererByType[FilterConfigType.BOOLEAN]('Joined date', value);
  },
  apiFilterRenderer(value: DateFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.BOOLEAN]('joinedAt', value);
  },
};

export default joinedDate;
