import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class SettingsService {
  static async find() {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings`,
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

    const tenantId = AuthService.getTenantId();
    const response = await authAxios.put(
      `/tenant/${tenantId}/settings`,
      body,
    );
    return response.data;
  }
}
