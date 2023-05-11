/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

interface MultiSelectFilterOption {
  label: string;
  value: string;
}
interface MultiSelectFilterOptions {
  options: MultiSelectFilterOption[]
}

export interface MultiSelectFilterValue {
  value: string[],
  exclude: boolean,
}

export interface MultiSelectFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.MULTISELECT;
  options: MultiSelectFilterOptions;
  itemLabelRenderer: (value: MultiSelectFilterValue) => string;
  queryRenderer: (value: MultiSelectFilterValue) => any;
}
