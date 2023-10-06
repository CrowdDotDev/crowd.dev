import { Filter } from '@/shared/modules/filters/types/FilterConfig';

export interface SavedView {
  id: string;
  label: string;
  filter: Filter & Record<string, any>
}

export interface SavedViewsSetting<T> {
  defaultValue: T,
  queryUrlParser: (value: string) => T;
  apiFilterRenderer: (value: T) => any[];
  inSettings: boolean;
  settingsComponent?: any;
}

export interface SavedViewsConfig {
  defaultView: SavedView;
  settings: Record<string, SavedViewsSetting<any>>,
  sorting: Record<string, string> // Object with property and label for sorting
}


export interface SavedViewCreate {
  label: string;
  visibility: string;
  placement: string;
  filter: Filter & Record<string, any>
}
