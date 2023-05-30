/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface DateFilterOptions {
  hideIncludeSwitch?: boolean;
}

export interface DateFilterValue {
  operator: string,
  value: string | string[],
  include: boolean,
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.DATE;
  options: DateFilterOptions;
  itemLabelRenderer: (value: DateFilterValue, options: DateFilterOptions) => string;
  apiFilterRenderer: (value: DateFilterValue) => any[];
}
