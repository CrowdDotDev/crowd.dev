import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const noOfOSSContributions: NumberFilterConfig = {
  id: 'noOfOSSContributions',
  label: '# of open source contributions',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `<b># of open source contributions</b> ${value?.value || '...'}`;
  },
  queryRenderer(value) {
    return {
      activityCount: value,
    };
  },
};

export default noOfOSSContributions;
