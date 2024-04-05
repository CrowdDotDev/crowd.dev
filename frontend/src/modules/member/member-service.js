import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';

export class MemberService {
  static async update(id, data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${id}`,
      {
        ...data,
        segments,
      },
    );

    return response.data;
  }

  static async updateBulk(data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.patch(
      `/tenant/${tenantId}/member`,
      {
        segments,
        data,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/member`,
      {
        params,
      },
    );

    return response.data;
  }

  static async create(data, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member`,
      {
        ...data.data,
        segments,
      },
    );

    return response.data;
  }

  static async findGithub(id) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/github/${id}`,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/export`,
      body,
    );

    return response.data;
  }

  static async find(id, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/${id}`,
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async listMembersAutocomplete({
    query,
    limit,
    segments = null,
  }) {
    const payload = {
      filter: {
        and: [
          {
            displayName: {
              textContains: query,
            },
          },
          {
            isOrganization: {
              not: true,
            },
          },
        ],
      },
      offset: 0,
      orderBy: 'displayName_ASC',
      limit,
      ...(segments && {
        segments,
      }),
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/autocomplete`,
      payload,
      {
        headers: {
          'x-crowd-api-version': '1',
        },
      },
    );

    return response.data.rows
      .map((m) => ({
        ...m,
        id: m.id,
        label: m.displayName,
        value: m.id,
        logo: m.attributes?.avatarUrl?.default || null,
        organizations: m.organizations?.map((organization) => ({
          id: organization.id,
          name: organization.displayName,
        })) ?? [],
      }));
  }

  static async listMembers(
    body,
    countOnly = false,
  ) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/query`,
      {
        ...body,
        countOnly,
      },
      {
        headers: {
          'x-crowd-api-version': '1',
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/member/active`,
      {
        params,
      },
    );

    return response.data;
  }

  static async merge(memberToKeep, memberToMerge, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberToKeep.id}/merge`,
      {
        memberToMerge: memberToMerge.id,
        segments,
      },
    );

    return response.data;
  }

  static async unmerge(memberId, preview) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/${memberId}/unmerge`,
      preview,
    );

    return response.data;
  }

  static async unmergePreview(memberId, platform, username) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/member/${memberId}/unmerge/preview`,
      {
        platform,
        username,
      },
    );

    return response.data;
  }

  static async addToNoMerge(memberA, memberB, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/member/${memberA.id}/no-merge`,
      {
        memberToNotMerge: memberB.id,
        segments,
      },
    );

    return response.data;
  }

  static async fetchMergeSuggestions(limit, offset, query, segments) {
    const tenantId = AuthService.getTenantId();

    const params = {
      limit,
      offset,
      segments,
      ...query,
    };

    return authAxios.get(
      `/tenant/${tenantId}/membersToMerge`,
      {
        params,
      },
    )
      .then(({ data }) => Promise.resolve(data));
  }

  static async getCustomAttribute(id, segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes/${id}`,
      {
        data: [
          segments,
        ],
      },
    );

    return response.data;
  }

  static async fetchCustomAttributes(segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        data: [
          segments,
        ],
      },
    );

    return response.data;
  }

  static async createCustomAttributes(data, segments) {
    const tenantId = AuthService.getTenantId();

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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(
      `/tenant/${tenantId}/settings/members/attributes`,
      {
        params,
      },
    );

    return response.data;
  }

  static async updateCustomAttribute(id, data, segments) {
    const tenantId = AuthService.getTenantId();

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
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(
      `/tenant/${tenantId}/enrichment/member/${id}`,
      {
        segments,
      },
    );

    return response.data;
  }

  static async enrichMemberBulk(ids, segments) {
    const tenantId = AuthService.getTenantId();

    return authAxios.put(
      `/tenant/${tenantId}/enrichment/member/bulk`,
      {
        members: ids,
        segments,
      },
    );
  }
}
