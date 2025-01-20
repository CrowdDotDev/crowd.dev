import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class SettingsService {
  static async find() {
    const response = await authAxios.get(
      '/settings',
      {
        params: {
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }

  static async save(settings) {
    const body = {
      settings,
      excludeSegments: true,
    };

    const response = await authAxios.put(
      '/settings',
      body,
    );
    return response.data;
  }
}
