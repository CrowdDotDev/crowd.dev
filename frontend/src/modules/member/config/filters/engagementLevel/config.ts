import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import options from './options';

const engagementLevel: MultiSelectFilterConfig = {
  id: 'engagementLevel',
  label: 'Engagement level',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return `<b>Engagement level</b> ${value?.value.join(',') || '...'}`;
  },
  queryRenderer(value: MultiSelectFilterValue): string {
    console.log(value);
    return '';
  },
};

export default engagementLevel;
