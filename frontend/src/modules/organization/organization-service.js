import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { router } from '@/router';

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
        segments: [router.currentRoute.value.query.projectGroup],
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

  static async unmergePreview(orgId, platform, name) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/organization/${orgId}/unmerge/preview`,
      {
        platform,
        name,
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
    grandParentSegment = false,
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
      orderBy: 'displayName_ASC',
      limit,
      ...(segments && {
        segments,
      }),
      ...(excludeSegments && {
        excludeSegments,
      }),
    };

    if (grandParentSegment) {
      payload.filter.and.push({
        grandParentSegment: {
          eq: grandParentSegment,
        },
      });
    }
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

    const data = {
      limit,
      offset,
      detail: true,
      ...query,
    };

    return authAxios.post(
      `/tenant/${tenantId}/organizationsToMerge`,
      data,
    )
      .then(({ data }) => Promise.resolve({
        rows: [
          {
            organizations: [
              {
                id: '1369d100-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'Software Engineer',
                logo: null,
              },
              {
                id: '0f9a2b60-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'Student',
                logo: null,
              },
            ],
            similarity: 0.99,
          },
          {
            organizations: [
              {
                id: '2692e820-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'moinjulian.com',
                logo: null,
              },
              {
                id: '3fb45bd0-da1f-11ee-85d4-778cfceb14e0',
                displayName: 'Superwall',
                logo: null,
              },
            ],
            similarity: 0.99,
          },
          {
            organizations: [
              {
                id: 'e71071c0-da1f-11ee-85d4-778cfceb14e0',
                displayName: 'Datasphere Consensus',
                logo: null,
              },
              {
                id: 'cd25f6d0-da20-11ee-85d4-778cfceb14e0',
                displayName: 'Cloud.in',
                logo: null,
              },
            ],
            similarity: 0.97,
          },
          {
            organizations: [
              {
                id: '27dc7f20-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'Devslane',
                logo: null,
              },
              {
                id: '192bd0c0-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'felixalguzman.msk.do',
                logo: null,
              },
            ],
            similarity: 0.95,
          },
          {
            organizations: [
              {
                id: '3b6ec2e0-da1f-11ee-85d4-778cfceb14e0',
                displayName: 'Saim Adib Sheikh',
                logo: null,
              },
              {
                id: 'cd261de0-da20-11ee-85d4-778cfceb14e0',
                displayName: 'IIIT Ranchi',
                logo: null,
              },
            ],
            similarity: 0.95,
          },
          {
            organizations: [
              {
                id: '19e73180-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'CORV Labs',
                logo: null,
              },
              {
                id: 'ebe02240-da1f-11ee-85d4-778cfceb14e0',
                displayName: 'Maulana Azad National Institute of Technology Bhopal',
                logo: null,
              },
            ],
            similarity: 0.92,
          },
          {
            organizations: [
              {
                id: '3dc42af0-da27-11ee-801f-939db0ee8335',
                displayName: 'Livecycle',
                logo: null,
              },
              {
                id: 'c96c4a30-da20-11ee-85d4-778cfceb14e0',
                displayName: 'gawdsnitkkr @NITKOSG',
                logo: null,
              },
            ],
            similarity: 0.9,
          },
          {
            organizations: [
              {
                id: '3f0a6030-da1f-11ee-85d4-778cfceb14e0',
                displayName: 'Birla Institute of Technology and Science',
                logo: null,
              },
              {
                id: 'a0bf94b0-da21-11ee-85d4-778cfceb14e0',
                displayName: 'Codsoft',
                logo: null,
              },
            ],
            similarity: 0.9,
          },
          {
            organizations: [
              {
                id: '4f994770-e802-4223-9223-87dc0a502d67',
                displayName: 'New Museum Of Contemporary Art',
                logo: null,
              },
              {
                id: '64749ec2-1b1d-46f2-8e2a-0ad94fde8ec3',
                displayName: 'New Museum Of Contemporary Art',
                logo: null,
              },
            ],
            similarity: 0.9,
          },
          {
            organizations: [
              {
                id: 'dc8d8400-da1e-11ee-85d4-778cfceb14e0',
                displayName: 'J.P. Morgan Chase & Co.',
                logo: 'https://avatars.githubusercontent.com/u/22640571?v=4',
              },
              {
                id: 'ce777d10-da20-11ee-85d4-778cfceb14e0',
                displayName: 'Self employeed',
                logo: null,
              },
            ],
            similarity: 0.9,
          },
        ],
        count: '14',
        limit: 10,
        offset: 0,
      }));
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
