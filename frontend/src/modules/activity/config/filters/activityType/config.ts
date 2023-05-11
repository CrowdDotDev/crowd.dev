import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ActivityTypeFilter from '@/modules/activity/config/filters/activityType/ActivityTypeFilter.vue';

const activityType: CustomFilterConfig = {
  id: 'activityType',
  label: 'Activity type',
  type: FilterConfigType.CUSTOM,
  component: ActivityTypeFilter,
  options: {
  },
  itemLabelRenderer(value): string {
    return 'Active on';
  },
  queryRenderer(value): string {
    return '';
  },
};

export default activityType;
