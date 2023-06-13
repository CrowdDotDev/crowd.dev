import { CustomFilterConfig } from '@/shared/modules/filters/types/filterTypes/CustomFilterConfig';
import { Project } from '@/modules/lf/segments/types/Segments';

export interface ProjectsFilterValue {
  value: string[];
}

export interface SubProjectsOption {
  id: string;
  label: string;
}

export interface ProjectsOption {
  id: string;
  label: string;
  selected: boolean;
  indeterminate: boolean;
  selectedChildren: string[];
  children: SubProjectsOption[];
}

export interface ProjectsCustomFilterOptions {
  remoteMethod: (value: {
    query: string;
    parentSlug: string | undefined;
  }) => Promise<Project[]>;
}

export interface ProjectsCustomFilterConfig extends CustomFilterConfig {
  options: ProjectsCustomFilterOptions;
}
