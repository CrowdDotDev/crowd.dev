import authAxios from '@/shared/axios/auth-axios';
import { CreateCategoryGroup } from '@/modules/admin/modules/categories/types/CategoryGroup';

export class CategoryService {
  static async create(collection: CreateCategoryGroup) {
    const response = await authAxios.post(
      '/collections',
      collection,
    );
    return response.data;
  }
}
