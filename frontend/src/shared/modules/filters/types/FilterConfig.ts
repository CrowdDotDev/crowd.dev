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
