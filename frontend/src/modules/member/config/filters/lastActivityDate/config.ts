import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { DateFilterConfig } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

const lastActivityDate: DateFilterConfig = {
  id: 'lastActivityDate',
  label: 'Last activity date',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value): string {
    return `<b>Last activity date</b> ${value.value || '...'}`;
  },
  queryRenderer(value): string {
    console.log(value);
    return '';
  },
};

export default lastActivityDate;
