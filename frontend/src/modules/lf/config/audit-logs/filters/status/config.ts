import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  SelectFilterConfig,
  SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const status: SelectFilterConfig = {
  id: 'status',
  label: 'Status',
  iconClass: 'ri-play-circle-line',
  type: FilterConfigType.SELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Status', value, options, data);
  },
  apiFilterRenderer({ value, include }: SelectFilterValue): any[] {
    const filter = {
      status: { eq: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default status;
