import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { DateFilterConfig } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

const joinedDate: DateFilterConfig = {
  id: 'joinedDate',
  label: 'Joined date',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value): string {
    return `<b>Joined date</b> ${value.value || '...'}`;
  },
  queryRenderer(value): string {
    console.log(value);
    return '';
  },
};

export default joinedDate;
