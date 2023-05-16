import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { DateFilterConfig } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';

const joinedDate: DateFilterConfig = {
  id: 'joinedDate',
  label: 'Joined date',
  type: FilterConfigType.DATE,
  options: {},
  itemLabelRenderer(value): string {
    return `Joined date ${value.value || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default joinedDate;
