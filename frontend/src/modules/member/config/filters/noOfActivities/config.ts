import { NumberFilterConfig, NumberFilterValue } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const noOfActivities: NumberFilterConfig = {
  id: 'noOfActivities',
  label: '# of activities',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value: NumberFilterValue): string {
    return itemLabelRendererByType[FilterConfigType.NUMBER]('# of activities', value);
  },
  apiFilterRenderer(value: NumberFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.NUMBER]('activityCount', value);
  },
};

export default noOfActivities;
