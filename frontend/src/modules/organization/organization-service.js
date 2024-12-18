import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service'; import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';

const getSelectedProjectGroup = () => {
  const lsSegmentsStore = useLfSegmentsStore();
  const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

  return selectedProjectGroup.value;
};

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
        segments: [getSelectedProjectGroup().id],
      },
    );

    return response.data;
  }

  static async unmerge(orgId, preview) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/${orgId}/unmerge`,
      preview,
    );

    return response.data;
  }

  static async unmergePreview(orgId, identity) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/${orgId}/unmerge/preview`,
      {
        ...identity,
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

  static async organizationsList(
    body,
  ) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/list`,
      body,
    );

    return response.data;
  }

  static async listByIds(
    ids,
  ) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/id`,
      {
        ids,
      },
    );

    return response.data;
  }

  static async listOrganizationsAutocomplete({
    query,
    limit,
    segments = null,
    excludeLfMember = false,
    excludeSegments = false,
  }) {
    const payload = {
      filter: {
        and: [
          {
            displayName: {
              matchPhrasePrefix: query,
            },
          },
          // ...(excludeLfMember ? [{
          //   lfxMembership: {
          //     ne: true,
          //   },
          // }] : []),
        ],
      },
      offset: 0,
      orderBy: 'activityCount_DESC',
      limit,
      ...(segments && {
        segments,
      }),
      ...(excludeSegments && {
        excludeSegments,
      }),
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/autocomplete`,
      payload,
    );

    return response.data.rows
      .map((o) => ({
        ...o,
        label: o.displayName,
        value: o.id,
      }));
  }

  static async fetchMergeSuggestions(limit, offset, query) {
    const tenantId = AuthService.getTenantId();

    const segments = [
      ...getSegmentsFromProjectGroup(getSelectedProjectGroup()),
      getSelectedProjectGroup().id,
    ];

    const data = {
      limit,
      offset,
      segments,
      detail: true,
      ...query,
    };

    return authAxios.post(
      `/tenant/${tenantId}/organizationsToMerge`,
      data,
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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/export`,
      body,
    );

    return response.data;
  }
}
