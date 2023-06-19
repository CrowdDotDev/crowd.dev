import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  SelectFilterConfig, SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const type: SelectFilterConfig = {
  id: 'type',
  label: 'Type',
  iconClass: 'ri-bank-line',
  type: FilterConfigType.SELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Type', value, options);
  },
  apiFilterRenderer({ value, include }: SelectFilterValue): any[] {
    const filter = {
      type: { eq: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default type;
