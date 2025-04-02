import authAxios from '@/shared/axios/auth-axios';
import { Category, CreateCategory } from '@/modules/admin/modules/categories/types/Category';

export class CategoryService {
  static async create(category: CreateCategory): Promise<Category> {
    const response = await authAxios.post(
      '/category',
      category,
    );
    return response.data;
  }

  static async update(categoryId: string, data: Partial<CreateCategory>): Promise<Category> {
    const response = await authAxios.patch(
      `/category/${categoryId}`,
      data,
    );
    return response.data;
  }

  static async delete(categoryId: string): Promise<boolean> {
    const response = await authAxios.delete(
      `/category/${categoryId}`,
    );
    return response.data;
  }

  static async deleteBulk(ids: string[]): Promise<boolean> {
    const response = await authAxios.delete(
      '/category',
      {
        data: {
          ids,
        },
      },
    );
    return response.data;
  }
}
