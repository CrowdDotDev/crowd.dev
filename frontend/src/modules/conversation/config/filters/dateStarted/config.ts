import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  SelectFilterConfig,
  SelectFilterOptions,
  SelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import options from './options';

const date: SelectFilterConfig = {
  id: 'dateStarted',
  label: 'Date started',
  iconClass: 'ri-calendar-event-line',
  type: FilterConfigType.SELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.SELECT]('Date started', value, options, data);
  },
  apiFilterRenderer({ value, include }: SelectFilterValue): any[] {
    const filter = {
      createdAt: { gte: value },
    };
    return [
      (include ? filter : { not: filter }),
    ];
  },
};

export default date;
