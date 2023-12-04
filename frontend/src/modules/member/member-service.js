import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class MemberService {
  static async update(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${id}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async updateBulk(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.patch(
      `/tenant/${tenantId}/member`,
      {
        data,
        excludeSegments: true,
        addDataAsArray: true,
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
      `/tenant/${tenantId}/member`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member`,
      {
        ...data.data,
        segments,
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
      `/tenant/${tenantId}/member/export`,
      body,
    );

    return response.data;
  }

  static async find(id, segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const [segmentId] = segments;

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        params: {
          segmentId,
        },
      },
    );

    return response.data;
  }

  static async listMembers(
    body,
    countOnly = false,
  ) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/query`,
      {
        ...body,
        countOnly,
      },
      {
        headers: {
          'x-crowd-api-version': '1',
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async listActive({
    platform,
    isTeamMember,
    activityTimestampFrom,
    activityTimestampTo,
    activityIsContribution,
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
      ...(isTeamMember === false && {
        'filter[isTeamMember]': isTeamMember,
      }),
      ...(activityIsContribution && {
        'filter[activityIsContribution]':
          activityIsContribution,
      }),
      'filter[isOrganization]': false,
      'filter[isBot]': false,
      'filter[activityTimestampFrom]':
        activityTimestampFrom,
      'filter[activityTimestampTo]': activityTimestampTo,
      orderBy,
      offset,
      limit,
      segments,
    };

    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/active`,
      {
        params,
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
    segments = [],
  }) {
    const params = {
      query,
      limit,
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/autocomplete`,
      {
        params,
      },
    );

    return response.data;
  }

  static async merge(memberToKeep, memberToMerge, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberToKeep.id}/merge`,
      {
        memberToMerge: memberToMerge.id,
        segments,
      },
    );

    return response.data;
  }

  static async addToNoMerge(memberA, memberB, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberA.id}/no-merge`,
      {
        memberToNotMerge: memberB.id,
        segments,
      },
    );

    return response.data;
  }

  static async fetchMergeSuggestions(limit, offset, segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const params = {
      limit,
      offset,
      segments,
    };

    return authAxios.get(
      `/tenant/${tenantId}/membersToMerge`,
      {
        params,
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    )
      .then(({ data }) => Promise.resolve(data));
  }

  static async getCustomAttribute(id, segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        data: [
          segments,
        ],
      },
    );

    return response.data;
  }

  static async fetchCustomAttributes(segments) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
        data: [
          segments,
        ],
      },
    );

    return response.data;
  }

  static async createCustomAttributes(data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async destroyCustomAttribute(id, segments) {
    const params = {
      ids: [id],
      segments,
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        params,
      },
    );

    return response.data;
  }

  static async updateCustomAttribute(id, data, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/settings/members/attributes/${id}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async enrichMember(id, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/enrichment/member/${id}`,
      {
        segments,
      },
    );

    return response.data;
  }

  static async enrichMemberBulk(ids, segments) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/enrichment/member/bulk`,
      {
        members: ids,
        segments,
      },
    );

    return response;
  }
}
