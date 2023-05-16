import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import options from './options';

const activeOn: MultiSelectFilterConfig = {
  id: 'activeOn',
  label: 'Active on',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value): string {
    return `<b>Last activity date</b> ${value.value.join(', ') || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default activeOn;
