import { NumberFilterConfig } from '@/shared/modules/filters/types/filterTypes/NumberFilterConfig';
import { MultiSelectFilterConfig } from '@/shared/modules/filters/types/filterTypes/MultiSelectFilterConfig';
import { SelectFilterConfig } from '@/shared/modules/filters/types/filterTypes/SelectFilterConfig';
import { BooleanFilterConfig } from '@/shared/modules/filters/types/filterTypes/BooleanFilterConfig';
import { DateFilterConfig } from '@/shared/modules/filters/types/filterTypes/DateFilterConfig';
import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';

export enum FilterConfigType {
  NUMBER = 'number',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  BOOLEAN = 'boolean',
  DATE = 'date',
  CUSTOM = 'custom',
}

export interface BaseFilterConfig {
  id: string;
  label: string;
}

export type FilterConfig = NumberFilterConfig
  | MultiSelectFilterConfig
  | SelectFilterConfig
  | BooleanFilterConfig
  | DateFilterConfig
  | CustomFilterConfig

export interface FilterStatic {
  search: string;
  relation: 'and' | 'or',
  order: {
    prop: string,
    order: 'descending' | 'ascending'
  },
  settings: Record<string, any>
}

export type FilterObject = FilterStatic & Record<string, any>

export interface Filter extends FilterObject {
  pagination: {
    page: number,
    perPage: number
  },
}
