import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class NoteService {
  static create(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    return authAxios
      .post(`/tenant/${tenantId}/note`, {
        ...data,
        segments,
      })
      .then((response) => response.data);
  }

  static update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    return authAxios
      .put(`/tenant/${tenantId}/note/${id}`, {
        ...data,
        segments,
      })
      .then((response) => response.data);
  }

  static destroyAll(ids, segments) {
    const params = {
      ids,
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    return authAxios
      .delete(`/tenant/${tenantId}/note`, {
        params,
        segments,
      })
      .then((response) => response.data);
  }

  static list({
    filter,
    orderBy,
    limit,
    offset,
    segments,
  }) {
    const body = {
      filter,
      orderBy,
      limit,
      offset,
      segments,
    };

    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    return authAxios
      .post(`/tenant/${tenantId}/note/query`, body, {
        headers: {
          Authorization: sampleTenant?.token,
        },
      })
      .then((response) => response.data);
  }
}
