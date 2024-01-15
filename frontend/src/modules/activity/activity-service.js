import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { store } from '@/store';
import moment from 'moment';

export class ActivityService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/activity/${id}`,
      data,
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(`/tenant/${tenantId}/activity`, {
      params,
    });

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/activity`,
      data.data,
    );

    return response.data;
  }

  static async query(body, countOnly = false) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();
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
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async listActivityTypes() {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(`/tenant/${tenantId}/activity/type`, {
      headers: {
        Authorization: sampleTenant?.token,
      },
    });

    return response.data;
  }

  static async listActivityChannels() {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/channel`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }
}
