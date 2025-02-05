import { Project } from '@/modules/lf/segments/types/Segments';

export interface CollectionModel {
  id: string;
  name: string;
  description: string;
  isLF: boolean;
  projects: Project[];
}

export interface InsightsProjectModel {
  id: string;
  name: string;
  logoUrl: string;
  starred: boolean;
}
