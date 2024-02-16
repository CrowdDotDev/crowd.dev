import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { SavedViewCreate } from '@/shared/modules/saved-views/types/SavedViewsConfig';

export class SavedViewsService {
  static query(params: any) {
    const tenantId = AuthService.getTenantId();

    return authAxios.get(
      `/tenant/${tenantId}/customview`,
      {
        params,
      },
    )
      .then((res) => res.data);
  }

  static create(view: SavedViewCreate) {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/customview`,
      view,
    )
      .then((res) => res.data);
  }

  static update(id: string, view: Partial<SavedViewCreate>) {
    const tenantId = AuthService.getTenantId();

    return authAxios.put(
      `/tenant/${tenantId}/customview/${id}`,
      view,
    )
      .then((res) => res.data);
  }

  static updateBulk(views: Partial<SavedViewCreate>[]) {
    const tenantId = AuthService.getTenantId();

    return authAxios.patch(
      `/tenant/${tenantId}/customview`,
      views,
    )
      .then((res) => res.data);
  }

  static delete(id: string) {
    const tenantId = AuthService.getTenantId();

    return authAxios.delete(
      `/tenant/${tenantId}/customview`,
      {
        params: {
          ids: [id],
        },
      },
    )
      .then((res) => res.data);
  }
}
