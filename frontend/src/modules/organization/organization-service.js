import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class OrganizationService {
  static async update(id, data, segments) {
    const tenantId = AuthService.getTenantId();

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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/organization`,
      {
        params,
      },
    );

    return response.data;
  }

  static async mergeOrganizations(organizationToKeepId, organizationToMergeId) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${organizationToKeepId}/merge`,
      {
        organizationToMerge: organizationToMergeId,
      },
    );

    return response.data;
  }

  static async addToNoMerge(organizationA, organizationB) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${organizationA.id}/no-merge`,
      {
        organizationToNotMerge: organizationB.id,
      },
    );

    return response.data;
  }

  static async noMergeOrganizations(organizationAId, organizationBId) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/organization/${organizationAId}/no-merge`,
      {
        organizationToNotMerge: organizationBId,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthService.getTenantId();

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
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/${id}`,
      {
        params: {
          segmentId: segments[0],
          // The parameter id on this one is sematically different, so we are excluding the logic to add segments as an array
          excludeSegments: true,
        },
      },
    );

    return response.data;
  }

  static async query(
    body,
  ) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/query`,
      body,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }

  static async fetchMergeSuggestions(limit, offset, query) {
    const tenantId = AuthService.getTenantId();

    const params = {
      limit,
      offset,
      ...query,
    };

    return authAxios.get(
      `/tenant/${tenantId}/organizationsToMerge`,
      {
        params,
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
    segments,
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
      segments,
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/organization/active`,
      {
        params,
      },
    );

    return response.data;
  }

  static async export({
    filter,
    orderBy,
    limit,
    offset,
    segments = [],
  }) {
    const body = {
      filter,
      orderBy,
      limit,
      offset,
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/export`,
      body,
    );

    return response.data;
  }
}
