import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';

export class MemberService {
  static async update(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${id}`,
      data,
    );

    return response.data;
  }

  static async updateBulk(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.patch(
      `/tenant/${tenantId}/member`,
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
      `/tenant/${tenantId}/member`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member`,
      data.data,
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
      `/tenant/${tenantId}/member/export`,
      body,
    );

    return response.data;
  }

  static async find(id) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
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

  static async listAutocomplete(query, limit) {
    const params = {
      query,
      limit,
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

  static async merge(memberToKeep, memberToMerge) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberToKeep.id}/merge`,
      {
        memberToMerge: memberToMerge.id,
      },
    );

    return response.data;
  }

  static async addToNoMerge(memberA, memberB) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberA.id}/no-merge`,
      {
        memberToNotMerge: memberB.id,
      },
    );

    return response.data;
  }

  static async fetchMergeSuggestions(limit, offset) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const params = {
      limit,
      offset,
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

  static async getCustomAttribute(id) {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes/${id}`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async fetchCustomAttributes() {
    const sampleTenant = AuthCurrentTenant.getSampleTenantData();
    const tenantId = sampleTenant?.id || AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        headers: {
          Authorization: sampleTenant?.token,
        },
      },
    );

    return response.data;
  }

  static async createCustomAttributes(data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/settings/members/attributes`,
      data,
    );

    return response.data;
  }

  static async destroyCustomAttribute(id) {
    const params = {
      ids: [id],
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

  static async updateCustomAttribute(id, data) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/settings/members/attributes/${id}`,
      data,
    );

    return response.data;
  }

  static async enrichMember(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/enrichment/member/${id}`,
    );

    return response.data;
  }

  static async enrichMemberBulk(ids) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/enrichment/member/bulk`,
      {
        members: ids,
      },
    );

    return response;
  }
}
