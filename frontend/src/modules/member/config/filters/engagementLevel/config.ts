import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import options from './options';

const engagementLevel: MultiSelectFilterConfig = {
  id: 'engagementLevel',
  label: 'Engagement level',
  iconClass: 'ri-user-voice-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Engagement level', value, options);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('score', value);
  },
};

export default engagementLevel;
