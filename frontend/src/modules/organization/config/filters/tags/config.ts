import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  StringFilterConfig,
  StringFilterOptions,
  StringFilterValue,
} from '@/shared/modules/filters/types/filterTypes/StringFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';

const tags: StringFilterConfig = {
  id: 'tags',
  label: 'Tags',
  iconClass: 'ri-price-tag-3-line',
  type: FilterConfigType.STRING,
  options: {},
  itemLabelRenderer(value: StringFilterValue, options: StringFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.STRING]('Tags', value, options);
  },
  apiFilterRenderer(value: StringFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.STRING]('tags', value);
  },
};

export default tags;
