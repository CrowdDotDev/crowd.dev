import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import ActivityTypeFilter from '@/modules/member/config/filters/activityType/ActivityTypeFilter.vue';
// import { SelectFilterOptions, SelectFilterValue } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import {
  MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { queryUrlParserByType } from '@/shared/modules/filters/config/queryUrlParserByType';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const activityType: CustomFilterConfig = {
  id: 'activityType',
  label: 'Activity type',
  iconClass: 'ri-radar-line',
  type: FilterConfigType.CUSTOM,
  component: ActivityTypeFilter,
  options: {
  },
  queryUrlParser: queryUrlParserByType[FilterConfigType.MULTISELECT],
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions, data: any): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Activity type', value, data, null, {
      addGroupLabel: true,
    });
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('activityTypes', value);
  },
};

export default activityType;
