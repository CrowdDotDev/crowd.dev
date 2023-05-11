/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from "@/shared/modules/filters/types/FilterConfig";

export interface DateFilterOptions {

}
export interface DateFilterValue {
  operator: string,
  value: string,
  exclude: boolean,
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.DATE;
  options: DateFilterOptions;
  itemLabelRenderer: (value: DateFilterValue) => string;
  queryRenderer: (value: DateFilterValue) => any;
}
