import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { DateFilterConfig } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

const joinedDate: DateFilterConfig = {
  id: 'joinedDate',
  label: 'Joined date',
  iconClass: 'ri-calendar-event-line',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value): string {
    return `<b>Joined date</b> ${value.value || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default joinedDate;
