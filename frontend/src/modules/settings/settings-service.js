import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class SettingsService {
  static async find() {
    const tenantId = AuthCurrentTenant.get();

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

    const tenantId = AuthCurrentTenant.get();
    const response = await authAxios.put(
      `/tenant/${tenantId}/settings`,
      body,
    );
    return response.data;
  }
}
