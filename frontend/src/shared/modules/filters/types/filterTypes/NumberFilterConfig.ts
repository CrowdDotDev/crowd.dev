/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from "@/shared/modules/filters/types/FilterConfig";

interface NumberFilterOptions {

}
export interface NumberFilterValue {
  operator: string,
  value: number | '',
  exclude: boolean,
}
export interface NumberFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.NUMBER;
  options: NumberFilterOptions;
  itemLabelRenderer: (value: NumberFilterValue) => string;
  queryRenderer: (value: NumberFilterValue) => any;
}
