/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface NumberFilterOptions {
  hideIncludeSwitch?: boolean;
}
export interface NumberFilterValue {
  operator: string,
  value: number | '',
  include: boolean,
}
export interface NumberFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.NUMBER;
  options: NumberFilterOptions;
  itemLabelRenderer: (value: NumberFilterValue, options: NumberFilterOptions) => string;
  apiFilterRenderer: (value: NumberFilterValue) => any[];
}
