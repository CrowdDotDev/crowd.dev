import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class ActivityTypeService {
  static async create(data, segments) {
    const response = await authAxios.post(
      '/settings/activity/types',
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async update(key, data, segments) {
    const response = await authAxios.put(
      `/settings/activity/types/${key}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async delete(key, segments) {
    const response = await authAxios.delete(
      `/settings/activity/types/${key}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async get() {
    const response = await authAxios.get(
      '/settings/activity/types',
    );

    return response.data;
  }
}
