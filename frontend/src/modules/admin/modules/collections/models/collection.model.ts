import { InsightsProjectModel } from '../../insights-projects/models/insights-project.model';

export interface CollectionModel {
  id: string;
  name: string;
  description: string;
  slug: string;
  isLF: boolean;
  projects: InsightsProjectModel[];
}

export interface CollectionFormModel {
  name: string;
  description: string;
  projects: InsightsProjectModel[];
}
