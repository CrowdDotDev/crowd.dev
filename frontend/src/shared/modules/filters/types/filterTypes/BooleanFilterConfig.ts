/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface BooleanFilterOptions {
  hideIncludeSwitch?: boolean;
}

export interface BooleanFilterValue {
  value: boolean,
  include: boolean,
}

export interface BooleanFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.BOOLEAN;
  options: BooleanFilterOptions;
  itemLabelRenderer: (value: BooleanFilterValue, options: BooleanFilterOptions, data: any) => string;
  apiFilterRenderer: (value: BooleanFilterValue) => any[];
}
