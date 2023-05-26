import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig,
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import options from './options';

const avgSentiment: MultiSelectFilterConfig = {
  id: 'avgSentiment',
  label: 'Avg. sentiment',
  iconClass: 'ri-speed-up-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Avg. sentiment', value, options);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('averageSentiment', value);
  },
};

export default avgSentiment;
