/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { FilterNumberOperator } from '@/shared/modules/filters/config/constants/number.constants';
import { ValidationRuleWithoutParams } from '@vuelidate/core';

export interface NumberFilterOptions {
  suffix?: string;
  forceOperator?: FilterNumberOperator;
  validators?: {
    [key: string]: ValidationRuleWithoutParams<any>;
  }
}
export interface NumberFilterValue {
  operator: FilterNumberOperator,
  value: number | '',
  valueTo?: number | '',
  include?: boolean,
}
export interface NumberFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.NUMBER;
  options: NumberFilterOptions;
  itemLabelRenderer: (value: NumberFilterValue, options: NumberFilterOptions, data: any) => string;
  apiFilterRenderer: (value: NumberFilterValue) => any[];
}
