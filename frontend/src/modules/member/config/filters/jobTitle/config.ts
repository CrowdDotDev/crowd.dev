import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  StringFilterConfig,
  StringFilterOptions,
  StringFilterValue,
} from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const jobTitle: StringFilterConfig = {
  id: 'jobTitle',
  label: 'Job title',
  iconClass: 'ri-suitcase-line',
  type: FilterConfigType.STRING,
  options: {},
  itemLabelRenderer(value: StringFilterValue, options: StringFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.STRING]('Job title', value, options);
  },
  apiFilterRenderer(value: StringFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.STRING]('attributes.jobTitle.default', value);
  },
};

export default jobTitle;
