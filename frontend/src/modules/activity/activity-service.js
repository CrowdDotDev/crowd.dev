import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { store } from '@/store';
import moment from 'moment';

export class ActivityService {
  static async update(id, data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/activity/${id}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async destroyAll(ids, segments) {
    const params = {
      ids,
      segments,
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(`/tenant/${tenantId}/activity`, {
      params,
    });

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/activity`,
      {
        ...data.data,
        segments,
      },
    );

    return response.data;
  }

  static async query(body, countOnly = false) {
    const tenantId = AuthService.getTenantId();
    const currentTenant = store.getters['auth/currentTenant'];

    const isTenantNew = moment(currentTenant.createdAt).add(1, 'months').isAfter(moment());

    // If tenant is less than a month old, use old query
    // Else use new query
    const response = await authAxios.post(
      `/tenant/${tenantId}/activity/query`,
      { ...body, countOnly },
      {
        headers: {
          ...(isTenantNew ? {} : { 'x-crowd-api-version': '1' }),
        },
      },
    );

    return response.data;
  }

  static async listActivityTypes(segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/type`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async listActivityChannels(segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/channel`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }
}
