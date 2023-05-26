import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import options from './options';

const sentiment: MultiSelectFilterConfig = {
  id: 'sentiment',
  label: 'Sentiment',
  iconClass: 'ri-speed-up-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return `<b>Sentiment</b> ${value?.value.join(',') || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default sentiment;
