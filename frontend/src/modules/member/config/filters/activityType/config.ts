import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ActivityTypeFilter from '@/modules/activity/config/filters/activityType/ActivityTypeFilter.vue';
import { SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';

const activityType: CustomFilterConfig = {
  id: 'activityType',
  label: 'Activity type',
  type: FilterConfigType.CUSTOM,
  component: ActivityTypeFilter,
  options: {
  },
  itemLabelRenderer(value: SelectFilterValue): string {
    return `<b>Active on</b> ${value || '...'}`;
  },
  queryRenderer(value: SelectFilterValue): string {
    console.log(value);
    return '';
  },
};

export default activityType;
