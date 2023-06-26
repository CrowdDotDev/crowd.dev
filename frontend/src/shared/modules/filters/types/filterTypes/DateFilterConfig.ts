/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';
import { FilterDateOperator } from "@/shared/modules/filters/config/constants/date.constants";

export interface DateFilterOptions {
  datepickerType?: 'date' | 'month' | 'year'
  dateFormat?: string
}

export interface DateFilterValue {
  operator: FilterDateOperator,
  value: string | string[],
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.DATE;
  options: DateFilterOptions;
  itemLabelRenderer: (value: DateFilterValue, options: DateFilterOptions, data: any) => string;
  apiFilterRenderer: (value: DateFilterValue) => any[];
}
