import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const noOfMembers: NumberFilterConfig = {
  id: 'noOfMembers',
  label: '# of members',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `<b># of members</b> ${value.value || '...'}`;
  },
  queryRenderer(value): string {
    console.log(value);
    return '';
  },
};

export default noOfMembers;
