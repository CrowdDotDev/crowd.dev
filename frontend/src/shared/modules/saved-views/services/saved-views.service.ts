import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { SavedViewCreate } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export class SavedViewsService {
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

  static create(view: SavedViewCreate) {
    const tenantId = AuthCurrentTenant.get();

    return authAxios.post(
      `/tenant/${tenantId}/customview`,
      view,
    )
      .then((res) => res.data);
  }

  static update(id: string, view: SavedViewCreate) {
    const tenantId = AuthCurrentTenant.get();

    return authAxios.put(
      `/tenant/${tenantId}/customview/${id}`,
      view,
    )
      .then((res) => res.data);
  }

  static delete(id: string) {
    const tenantId = AuthCurrentTenant.get();

    return authAxios.delete(
      `/tenant/${tenantId}/customview/${id}`,
    )
      .then((res) => res.data);
  }
}
