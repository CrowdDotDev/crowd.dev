import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ActivityTypeFilter from '@/modules/member/config/filters/activityType/ActivityTypeFilter.vue';
import { SelectFilterOptions, SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';

const activityType: CustomFilterConfig = {
  id: 'activityType',
  label: 'Activity type',
  iconClass: 'ri-radar-line',
  type: FilterConfigType.CUSTOM,
  component: ActivityTypeFilter,
  options: {
  },
  queryUrlParser: queryUrlParserByType[FilterConfigType.SELECT],
  itemLabelRenderer(value: SelectFilterValue, options: SelectFilterOptions, data: any): string {
    console.log(value, options, data);
    return itemLabelRendererByType[FilterConfigType.SELECT]('Activity type', value, data);
  },
  apiFilterRenderer(value: SelectFilterValue): any[] {
    console.log(value);
    return [];
    // return apiFilterRendererByType[FilterConfigType.SELECT]('activityTypes', value);
  },
};

export default activityType;
