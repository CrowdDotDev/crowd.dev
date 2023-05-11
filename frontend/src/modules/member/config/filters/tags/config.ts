import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { MultiSelectFilterConfig, MultiSelectFilterValue } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';

const tags: MultiSelectFilterConfig = {
  id: 'tags',
  label: 'Tags',
  type: FilterConfigType.MULTISELECT,
  options: {
    // TODO: load this options remote
    options: [],
  },
  itemLabelRenderer(value: MultiSelectFilterValue): string {
    return `<b>Tags</b> ${value?.value.join(',') || '...'}`;
  },
  queryRenderer(value: MultiSelectFilterValue): string {
    console.log(value);
    return '';
  },
};

export default tags;
