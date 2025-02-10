import { InsightsProjectModel } from '../../insights-projects/models/insights-project.model';

export interface CollectionModel {
  id: string;
  name: string;
  description: string;
  isLF: boolean;
  projects: InsightsProjectModel[];
}
