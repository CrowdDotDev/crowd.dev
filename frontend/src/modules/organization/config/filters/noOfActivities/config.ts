import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const noOfActivities: NumberFilterConfig = {
  id: 'noOfActivities',
  label: '# of activities',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `<b># of activities</b> ${value?.value || '...'}`;
  },
  queryRenderer(value) {
    return {
      activityCount: value,
    };
  },
};

export default noOfActivities;
