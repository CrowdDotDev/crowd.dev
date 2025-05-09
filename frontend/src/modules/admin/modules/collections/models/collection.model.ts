import { Category } from '@/modules/admin/modules/categories/types/Category';
import { InsightsProjectModel } from '../../insights-projects/models/insights-project.model';

export interface CollectionModel {
  id: string;
  name: string;
  description: string;
  slug: string;
  categoryId?: string;
  projects: InsightsProjectModel[];
  category: Category & {categoryGroupType: string, categoryGroupName: string};
  starred?: boolean;
}

export interface CollectionRequest {
  name: string;
  description: string;
  categoryId: string | null;
  slug: string;
  projects: {
    id: string;
    starred: boolean;
  }[];
}
export interface CollectionFormModel {
  name: string;
  description: string;
  type: string | null;
  categoryId: string | null;
  projects: InsightsProjectModel[];
}
