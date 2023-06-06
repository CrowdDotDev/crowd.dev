import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import buildApiPayload from '@/shared/filter/helpers/build-api-payload';
import { DEFAULT_ACTIVITY_FILTERS } from '@/modules/activity/store/constants';

export class ActivityService {
  static async update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

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

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/activity`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/activity`,
      {
        ...data.data,
        segments,
      },
    );

    return response.data;
  }

  static async find(id, segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async list({
    customFilters,
    orderBy,
    limit,
    offset,
    segments = [],
    buildFilter = true,
    buildWithDefaultRootFilters = true,
  }) {
    const body = {
      filter: buildApiPayload({
        customFilters,
        defaultRootFilters: buildWithDefaultRootFilters ? DEFAULT_ACTIVITY_FILTERS : [],
        buildFilter,
      }),
      segments,
      orderBy,
      limit,
      offset,
    };

    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/activity/query`,
      body,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async listAutocomplete({
    query,
    limit,
    segments,
  }) {
    const params = {
      query,
      limit,
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/activity/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }
}
