import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

const reach: NumberFilterConfig = {
  id: 'reach',
  label: 'Reach',
  type: FilterConfigType.NUMBER,
  options: {},
  itemLabelRenderer(value): string {
    return `<b>Reach</b> ${value?.value || '...'}`;
  },
  queryRenderer(value) {
    return {
      activityCount: value,
    };
  },
};

export default reach;
