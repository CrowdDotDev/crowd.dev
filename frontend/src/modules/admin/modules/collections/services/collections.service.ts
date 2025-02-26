import authAxios from '@/shared/axios/auth-axios';

export class CollectionsService {
  static async list(query: any) {
    const response = await authAxios.post(
      '/collections/query',
      query,
    );

    return response.data;
  }

  static async create(collection: any) {
    const response = await authAxios.post(
      '/collections',
      collection,
    );
    return response.data;
  }

  static async update(collectionId: string, collection: any) {
    const response = await authAxios.post(
      `/collections/${collectionId}`,
      collection,
    );
    return response.data;
  }

  static async delete(collectionId: string) {
    const response = await authAxios.delete(
      `/collections/${collectionId}`,
    );

    return response.data;
  }
}
