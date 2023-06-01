/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { FilterStringOperator } from '@/shared/modules/filters/config/constants/string.constants';

export interface StringFilterOptions {
  hideIncludeSwitch?: boolean;
}

export interface StringFilterValue {
  operator: FilterStringOperator,
  value: string,
  include: boolean,
}

export interface StringFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.STRING;
  options: StringFilterOptions;
  itemLabelRenderer: (value: StringFilterValue, options: StringFilterOptions, data: any) => string;
  apiFilterRenderer: (value: StringFilterValue) => any[];
}
