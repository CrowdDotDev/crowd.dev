import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import { CollectionModel } from '../models/collection.model';

export class CollectionsService {
  static async list(query: any) {
    const response = await authAxios.post(
      '/collections/query',
      query,
    );

    return response.data;
  }

  query(
    query: () => Record<string, string | number | object>,
  ): QueryFunction<Pagination<CollectionModel>> {
    return ({ pageParam = 0 }) => authAxios
      .post<Pagination<CollectionModel>>('/collections/query', {
        ...query(),
        offset: pageParam,
      })
      .then((res) => res.data);
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

export const COLLECTIONS_SERVICE = new CollectionsService();
