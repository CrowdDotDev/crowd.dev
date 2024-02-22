import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class OrganizationService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${id}`,
      data,
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
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

  static async mergeOrganizations(organizationToKeepId, organizationToMergeId) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${organizationToKeepId}/merge`,
      {
        organizationToMerge: organizationToMergeId,
      },
    );

    return response.data;
  }

  static async addToNoMerge(organizationA, organizationB) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${organizationA.id}/no-merge`,
      {
        organizationToNotMerge: organizationB.id,
      },
    );

    return response.data;
  }

  static async noMergeOrganizations(organizationAId, organizationBId) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${organizationAId}/no-merge`,
      {
        organizationToNotMerge: organizationBId,
      },
    );

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization`,
      data,
    );

    return response.data;
  }

  static async find(id) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async query(
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

  static async listAutocomplete(query, limit) {
    const params = {
      query,
      limit,
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

  static async fetchMergeSuggestions(limit, offset, query) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const params = {
      limit,
      offset,
      ...query,
    };

    return authAxios.get(
      `/tenant/${tenantId}/organizationsToMerge`,
      {
        params,
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    )
      .then(({ data }) => Promise.resolve(data));
  }

  static async listActive({
    platform,
    isTeamOrganization,
    activityTimestampFrom,
    activityTimestampTo,
    orderBy,
    offset,
    limit,
  }) {
    const params = {
      ...(platform.length && {
        'filter[platforms]': platform
          .map((p) => p.value)
          .join(','),
      }),
      ...(isTeamOrganization === false && {
        'filter[isTeamOrganization]': isTeamOrganization,
      }),
      'filter[activityTimestampFrom]':
        activityTimestampFrom,
      'filter[activityTimestampTo]': activityTimestampTo,
      orderBy,
      offset,
      limit,
    };

    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/active`,
      {
        params,
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async export({
    filter,
    orderBy,
    limit,
    offset,
  }) {
    const body = {
      filter,
      orderBy,
      limit,
      offset,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/export`,
      body,
    );

    return response.data;
  }
}
