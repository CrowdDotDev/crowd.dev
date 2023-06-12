import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import buildApiPayload from '@/shared/filter/helpers/build-api-payload';
import { DEFAULT_ORGANIZATION_FILTERS } from '@/modules/organization/store/constants';

export class OrganizationService {
  static async update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${id}`,
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
      `/tenant/${tenantId}/organization`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async find(id, segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/${id}`,
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
  }) {
    const body = {
      filter: buildApiPayload({
        customFilters,
        defaultFilters: DEFAULT_ORGANIZATION_FILTERS,
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
      `/tenant/${tenantId}/organization/query`,
      body,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async listOrganizations(
    body,
  ) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/query`,
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
      `/tenant/${tenantId}/organization/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }
}
