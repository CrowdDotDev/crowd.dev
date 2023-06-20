import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  SelectFilterConfig, SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const headcount: SelectFilterConfig = {
  id: 'headcount',
  label: 'Headcount',
  iconClass: 'ri-group-2-line',
  type: FilterConfigType.SELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Headcount', value, options);
  },
  apiFilterRenderer({ value, include }: SelectFilterValue): any[] {
    const filter = {
      size: value,
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default headcount;
