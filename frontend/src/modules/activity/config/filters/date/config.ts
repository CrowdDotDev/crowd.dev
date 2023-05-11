import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { SelectFilterConfig, SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import options from './options';

const date: SelectFilterConfig = {
  id: 'date',
  label: 'Date',
  type: FilterConfigType.SELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: SelectFilterValue): string {
    return `<b>Date</b> ${value || '...'}`;
  },
  queryRenderer(value: SelectFilterValue): string {
    console.log(value);
    return '';
  },
};

export default date;
