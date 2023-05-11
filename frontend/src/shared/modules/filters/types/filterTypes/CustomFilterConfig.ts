/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';


export interface CustomFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.CUSTOM;
  component: any;
  options: any;
  itemLabelRenderer: (value: any) => string;
  queryRenderer: (value: any) => any;
}
