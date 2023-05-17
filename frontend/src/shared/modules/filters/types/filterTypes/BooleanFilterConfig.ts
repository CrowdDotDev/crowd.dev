/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface BooleanFilterOptions {
}

export interface BooleanFilterValue {
  value: boolean,
  exclude: boolean,
}

export interface BooleanFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.BOOLEAN;
  options: BooleanFilterOptions;
  itemLabelRenderer: (value: BooleanFilterValue) => string;
  apiFilterRenderer: (value: BooleanFilterValue) => any[];
}
