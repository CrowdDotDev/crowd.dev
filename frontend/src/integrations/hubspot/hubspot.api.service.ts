import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import authAxios from '@/shared/axios/auth-axios';

export class HubspotApiService {
  static getMappableFields() {
    const tenantId = AuthCurrentTenant.get();

    return authAxios.get(
      `/tenant/${tenantId}/hubspot-mappable-fields`,
    )
      .then((response) => response.data);
  }
}
