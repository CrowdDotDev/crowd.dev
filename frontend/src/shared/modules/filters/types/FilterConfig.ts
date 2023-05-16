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

interface FilterObject {
  search: string;
  relation: 'and' | 'or',
  order: {
    prop: string,
    order: 'descending' | 'ascending'
  },
  pagination: {
    page: number,
    perPage: number
  },
  config: Record<string, any>
}

export type Filter = FilterObject & Record<string, any>
