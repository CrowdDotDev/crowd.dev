/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface StringFilterOptions {

}
export interface StringFilterValue {
  operator: string,
  value: string,
  include: boolean,
}
export interface StringFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.STRING;
  options: StringFilterOptions;
  itemLabelRenderer: (value: StringFilterValue) => string;
  apiFilterRenderer: (value: StringFilterValue) => any[];
}
