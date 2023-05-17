/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

interface SelectFilterOption {
  label: string;
  value: string;
}
export interface SelectFilterOptionGroup {
  label: string;
  options: SelectFilterOption[];
}

export interface SelectFilterOptions {
  options: SelectFilterOptionGroup[]
}

export interface SelectFilterValue {
  value: string,
  exclude: boolean,
}

export interface SelectFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.SELECT;
  options: SelectFilterOptions;
  itemLabelRenderer: (value: SelectFilterValue) => string;
  apiFilterRenderer: (value: SelectFilterValue) => any[];
}
