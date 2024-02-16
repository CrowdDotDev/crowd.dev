import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class NoteService {
  static create(data, segments) {
    const tenantId = AuthService.getTenantId();

    return authAxios
      .post(`/tenant/${tenantId}/note`, {
        ...data,
        segments,
      })
      .then((response) => response.data);
  }

  static update(id, data, segments) {
    const tenantId = AuthService.getTenantId();

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

    const tenantId = AuthService.getTenantId();

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

    const tenantId = AuthService.getTenantId();

    return authAxios
      .post(`/tenant/${tenantId}/note/query`, body)
      .then((response) => response.data);
  }
}
