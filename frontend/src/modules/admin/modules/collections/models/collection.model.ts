import { Category } from '@/modules/admin/modules/categories/types/Category';
import { InsightsProjectModel } from '../../insights-projects/models/insights-project.model';

export interface CollectionModel {
  id: string;
  name: string;
  description: string;
  slug: string;
  isLF: boolean;
  categoryId?: string;
  projects: InsightsProjectModel[];
  category: Category & {categoryGroupType: string, categoryGroupName: string};
}

export interface CollectionFormModel {
  name: string;
  description: string;
  type: string | null;
  categoryId: string | null;
  projects: InsightsProjectModel[];
}
