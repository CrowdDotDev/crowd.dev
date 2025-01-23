import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class TagService {
  static async update(id, data) {
    const response = await authAxios.put(
      `/tag/${id}`,
      data,
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
    };

    const response = await authAxios.delete(
      '/tag',
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data) {
    const response = await authAxios.post(
      '/tag',
      data,
    );

    return response.data;
  }

  static async find(id) {
    const response = await authAxios.get(
      `/tag/${id}`,
    );

    return response.data;
  }

  static async list({
    filter,
    orderBy,
    limit,
    offset,
  }) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
    };

    const response = await authAxios.get(
      '/tag',
      {
        params,
      },
    );

    return response.data;
  }

  static async listAutocomplete({
    query,
    limit,
  }) {
    const params = {
      query,
      limit,
    };

    const response = await authAxios.get(
      '/tag/autocomplete',
      {
        params,
      },
    );

    return response.data;
  }
}
