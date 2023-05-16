import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const noOfActivities: NumberFilterConfig = {
  id: 'noOfActivities',
  label: '# of activities',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `# of activities ${value?.value || '...'}`;
  },
  apiFilterRenderer({ value }): any[] {
    return [
      { activityCount: { eq: value } },
    ];
  },
};

export default noOfActivities;
