import authAxios from '@/shared/axios/auth-axios';
import { Pagination } from '@/shared/types/Pagination';
import { QueryFunction } from '@tanstack/vue-query';
import { CollectionModel, CollectionRequest } from '../models/collection.model';

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

  create(collection: CollectionRequest) {
    return authAxios.post(
      '/collections',
      collection,
    ).then((res) => res.data);
  }

  update(collectionId: string, collection: CollectionRequest) {
    return authAxios.post(
      `/collections/${collectionId}`,
      collection,
    ).then((res) => res.data);
  }

  delete(id: string) {
    return authAxios
      .delete(`/collections/${id}`)
      .then((res) => res.data);
  }
}

export const COLLECTIONS_SERVICE = new CollectionsService();
