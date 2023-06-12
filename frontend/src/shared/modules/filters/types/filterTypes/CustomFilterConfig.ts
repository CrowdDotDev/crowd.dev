/* eslint-disable no-unused-vars */
import { BaseFilterConfig, FilterConfigType } from '@/shared/modules/filters/types/FilterConfig';

export interface CustomFilterOptions {
  remoteMethod?: (value: any) => Promise<any[]>
}

export interface CustomFilterConfig extends BaseFilterConfig {
  type: FilterConfigType.CUSTOM;
  component: any;
  options: CustomFilterOptions;
  queryUrlParser: ((value: any) => Record<string, any>) | null;
  itemLabelRenderer: (value: any, options: any, data: any) => string;
  apiFilterRenderer: (value: any) => any[];
}
