import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ActivityTypeFilter from '@/modules/activity/config/filters/activityType/ActivityTypeFilter.vue';
import { SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';

const activityType: CustomFilterConfig = {
  id: 'activityType',
  label: 'Activity type',
  iconClass: 'ri-radar-line',
  type: FilterConfigType.CUSTOM,
  component: ActivityTypeFilter,
  options: {
  },
  queryUrlParser: queryUrlParserByType[FilterConfigType.SELECT],
  itemLabelRenderer(value: SelectFilterValue): string {
    return `<b>Activity type</b> ${value || '...'}`;
  },
  apiFilterRenderer(value): any[] {
    console.log(value);
    return [];
  },
};

export default activityType;
