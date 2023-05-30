/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface DateFilterOptions {
  hideIncludeSwitch?: boolean;
}

export interface DateFilterValue {
  operator: string,
  value: string,
  include: boolean,
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.DATE;
  options: DateFilterOptions;
  itemLabelRenderer: (value: DateFilterValue, options: DateFilterOptions, data: any) => string;
  apiFilterRenderer: (value: DateFilterValue) => any[];
}
