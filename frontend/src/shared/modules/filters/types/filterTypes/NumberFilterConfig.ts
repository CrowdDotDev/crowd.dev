/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { FilterNumberOperator } from '@/shared/modules/filters/config/constants/number.constants';

export interface NumberFilterOptions {
  hideIncludeSwitch?: boolean;
}
export interface NumberFilterValue {
  operator: FilterNumberOperator,
  value: number | '',
  valueTo: number | '',
  include: boolean,
}
export interface NumberFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.NUMBER;
  options: NumberFilterOptions;
  itemLabelRenderer: (value: NumberFilterValue, options: NumberFilterOptions) => string;
  apiFilterRenderer: (value: NumberFilterValue) => any[];
}
