import { Filter } from '@/shared/modules/filters/types/FilterConfig';

export interface SavedView {
  id: string;
  label: string;
  filter: Filter & Record<string, any>
}

export interface SavedViewsSetting<T> {
  component?: any;
  defaultValue: T,
  queryUrlParser: (value: string) => T;
  apiFilterRenderer: (value: T) => any[];
}

export interface SavedViewsConfig {
  defaultView: SavedView;
  settings: Record<string, SavedViewsSetting<any>>
}
