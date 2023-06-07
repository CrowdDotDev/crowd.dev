import { FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import {
  MultiSelectFilterConfig, MultiSelectFilterOptions,
  MultiSelectFilterValue,
} from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { itemLabelRendererByType } from '@/shared/modules/filters/config/itemLabelRendererByType';
import { apiFilterRendererByType } from '@/shared/modules/filters/config/apiFilterRendererByType';
import options from './options';

const activeOn: MultiSelectFilterConfig = {
  id: 'activeOn',
  label: 'Active on',
  iconClass: 'ri-apps-2-line',
  type: FilterConfigType.MULTISELECT,
  options: {
    options,
  },
  itemLabelRenderer(value: MultiSelectFilterValue, options: MultiSelectFilterOptions): string {
    return itemLabelRendererByType[FilterConfigType.MULTISELECT]('Active on', value, options);
  },
  apiFilterRenderer(value: MultiSelectFilterValue): any[] {
    return apiFilterRendererByType[FilterConfigType.MULTISELECT]('activeOn', value);
  },
};

export default activeOn;
