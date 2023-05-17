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
    return `Engagement level ${value?.value.join(',') || '...'}`;
  },
  apiFilterRenderer(): any[] {
    return [];
  },
};

export default engagementLevel;
