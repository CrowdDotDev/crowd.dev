import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import { StringFilterConfig, StringFilterOptions, StringFilterValue } from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';

const seniorityLevel: StringFilterConfig = {
  id: 'seniorityLevel',
  label: 'Seniority level',
  iconClass: 'ri-menu-2-line',
  type: FilterConfigType.STRING,
  options: {},
  itemLabelRenderer(value: StringFilterValue, options: StringFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.STRING]('Seniority level', value, options);
  },
  apiFilterRenderer(value: StringFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.STRING]('attributes.seniorityLevel.default', value);
  },
};
export default seniorityLevel;
