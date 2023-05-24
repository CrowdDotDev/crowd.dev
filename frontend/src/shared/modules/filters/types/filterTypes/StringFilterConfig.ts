/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType, FilterOperator } from '@/shared/modules/filters/types/FilterConfig';

export interface StringFilterOptions {
  hideIncludeSwitch?: boolean;
}
export interface StringFilterValue {
  operator: FilterOperator,
  value: string,
  include: boolean,
}

export interface StringFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.STRING;
  options: StringFilterOptions;
  itemLabelRenderer: (value: StringFilterValue) => string;
  apiFilterRenderer: (value: StringFilterValue) => any[];
}
