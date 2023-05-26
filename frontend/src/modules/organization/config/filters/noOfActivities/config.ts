import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const noOfActivities: NumberFilterConfig = {
  id: 'noOfActivities',
  label: '# of activities',
  iconClass: 'ri-radar-line',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `<b># of activities</b> ${value?.value || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default noOfActivities;
