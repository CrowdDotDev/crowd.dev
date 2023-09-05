import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig, MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const headcount: MultiSelectFilterConfig = {
  id: 'headcount',
  label: 'Headcount',
  iconClass: 'ri-group-2-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Headcount', value, options);
  },
  apiFilterRenderer({ value, include }: MultiSelectFilterValue): any[] {
    const filter = {
      or: value.map((count) => ({ size: count })),
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default headcount;
