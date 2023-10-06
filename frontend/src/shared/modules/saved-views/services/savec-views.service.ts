import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class SavecViewsService {
  static query(params: any) {
    const tenantId = AuthCurrentTenant.get();

    return authAxios.get(
      `/tenant/${tenantId}/customview`,
      {
        params,
      },
    )
      .then((res) => res.data);
  }
}
