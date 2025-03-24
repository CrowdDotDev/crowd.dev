import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentsFromProjectGroup } from '@/utils/segments';
import { storeToRefs } from 'pinia';

const getSelectedProjectGroup = () => {
  const lsSegmentsStore = useLfSegmentsStore();
  const { selectedProjectGroup } = storeToRefs(lsSegmentsStore);

  return selectedProjectGroup.value;
};

export class ActivityService {
  static async update(id, data, segments) {
    const response = await authAxios.put(
      `/activity/${id}`,
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

    const response = await authAxios.delete('/activity', {
      params,
    });

    return response.data;
  }

  static async create(data, segments) {
    const response = await authAxios.post(
      '/activity',
      {
        ...data.data,
        segments,
      },
    );

    return response.data;
  }

  static async query(body, countOnly = false) {
    // const segments = [
    //   ...body?.segments ?? getSegmentsFromProjectGroup(getSelectedProjectGroup()),
    //   getSelectedProjectGroup().id,
    // ];
    const response = await authAxios.post(
      '/activity/query',
      {
        ...body,
        countOnly,
        segments: body.segments,
      },
      {
        headers: {
          'x-crowd-api-version': '1',
        },
      },
    );

    const mockData =  {
      "count": 26,
      "rows": [
        {
          "id": "9ffbb4e5-5fc4-47e4-ac65-2395e350c97b",
          "attributes": {
            "state": "open"
          },
          "body": "",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:38.898Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qT-x2",
          "sourceParentId": "",
          "timestamp": "2025-02-17T10:05:50.000Z",
          "title": "Endpoint to list project's repositories",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:38.898Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2847",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "16b2ed64-387c-4507-980c-079d1bbd67d6",
          "attributes": {
            "state": "closed"
          },
          "body": "https://app.datadoghq.com/logs?query=cluster_name:cm-prod-oracle%20service:data-sink-worker%20status:error%20@err.message:%22null%20value%20in%20column%20%5C%22organizationId%5C%22%20of%20relation%20%5C%22organizationSegments%5C%22%20violates%20not-null%20constraint%22&agg_m=count&agg_m_source=base&agg_t=count&clustering_pattern_field_path=message&cols=host,service&fromUser=true&messageDisplay=inline&storage=hot&stream_sort=desc&viz=stream&from_ts=1739459913277&to_ts=1739546313277&live=true\nnull value in co",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:38.585Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qHFq_",
          "sourceParentId": "",
          "timestamp": "2025-02-14T15:20:40.000Z",
          "title": "Issue in data-sink-worker",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:38.585Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2845",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "aa562872-d5d4-4bf3-8979-0f5064dbef0f",
          "attributes": {
            "state": "open"
          },
          "body": "Out of 5.5million identities, seems like 5mil is marked verified\nAvailable platforms in memberIdentities:\n\nunknown\ncustom\nintegration_or_enrichment\ntraining_cert\nlfid\nintegration\n\n\nWe should try to discover if there is any issue with the verification process.Also, we should try to understand if we really need the identities with these platforms",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:38.100Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qFK_J",
          "sourceParentId": "",
          "timestamp": "2025-02-14T11:50:12.000Z",
          "title": "Investigate verified and platform fields correctness for member identities",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:38.100Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2842",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "2c86b684-b715-4bd1-931c-f202be461a16",
          "attributes": {
            "state": "open"
          },
          "body": "Currently, the functionality to affiliate an organization to a single activity is not working.When the new CM affiliations work was done, we also didn't thought about the impact on these individual affiliations. We need to re-assess how this should play a role in the whole flow",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:37.998Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qFJxE",
          "sourceParentId": "",
          "timestamp": "2025-02-14T11:48:24.000Z",
          "title": "Individually activity affiliations",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:37.998Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2841",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "660fceec-4ee5-4ed5-be89-45926c830206",
          "attributes": {
            "state": "open"
          },
          "body": "select * from membersegmentaffiliations where memberid='0d04e2ba-9e2c-41e2-8789-5bba50addcd5' and segmentid='0b833da9-ffe6-458d-b9d2-a709e6b81b00';\n\nReturns 3 affiliations exactly with the same values.\nWe shouldn't allow affiliations for the same project to have the exact same period",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:37.898Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qFHya",
          "sourceParentId": "",
          "timestamp": "2025-02-14T11:45:22.000Z",
          "title": "membersegmentaffiliations allows duplicated affiliations",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:37.898Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2840",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "c77377c7-30c7-4526-b979-688a6feb36af",
          "attributes": {
            "state": "open"
          },
          "body": "memberId=297c16c9-825e-4b91-9094-5440ac11bdf0 has over 1k identities attached to it that are all marked verified and lots of affiliations too which doesn't make sense https://cm.lfx.dev/people/297c16c9-825e-4b91-9094-5440ac11bdf0?projectGroup=dc48fac5-b31a-4659-ac99-60eb52a1082a\nwhat is this reddit deleted user, this one has over 1k identities all marked verified but there are other memberIds with similar (deleted) identities memberId=319f1310-a8f4-11ef-b2dd-7d281cffca71 https://cm.lfx.dev/people/319f1310-a",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:37.796Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qFGF_",
          "sourceParentId": "",
          "timestamp": "2025-02-14T11:43:05.000Z",
          "title": "Incorrect profiles with 1k identities",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:37.796Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2839",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "2a381b74-fec5-4cbd-a979-a5efb726d91e",
          "attributes": {
            "state": "open"
          },
          "body": "https://linuxfoundation.slack.com/archives/C082ZTD9WPL/p1738917944278979?thread_ts=1738866171.790779&cid=C082ZTD9WPL\nTriggered alerts because of this:\n\nhttps://linuxfoundation.slack.com/archives/C082ZTD9WPL/p1738684200155619\nhttps://linuxfoundation.slack.com/archives/C082ZTD9WPL/p1738787400715749",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:37.694Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6qFFbE",
          "sourceParentId": "",
          "timestamp": "2025-02-14T11:42:04.000Z",
          "title": "Prevent making duplicated requests when connecting an integration",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:37.694Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2838",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "0c030db9-2785-408c-8510-8ef5213e2aa3",
          "attributes": {
            "state": "closed"
          },
          "body": "https://linuxfoundation.slack.com/archives/C06VBQPK249/p1739274613896959?thread_ts=1739263868.079109&cid=C06VBQPK249\nIssue:The data returned in the GET /api/member/id/organization endpoint:\n[\n {\n  ...\n  \"memberOrganizations\": {\n    ...\n    \"affiliationOverride\": {\n      ...\n    }\n  }\n}\n ...\n]\n\nis not the same as the data return in the POST /api/member/query endpoint, where only memberOrganizations is returned without affiliationOverrides.This was added recently as a new table and it was only added to the pr",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:37.001Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6p7pex",
          "sourceParentId": "",
          "timestamp": "2025-02-13T13:05:11.000Z",
          "title": "Return affiliationOverride in member/query",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:37.001Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2830",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "cdd6732f-1c3d-4222-801e-875e2aa2a128",
          "attributes": {
            "state": "open"
          },
          "body": "Based on the Collections CM-2052  we generate, we need to have a way to classify projects into the existing collections.\nJoan has already started this work https://github.com/linuxfoundation/lfx-architecture-scratch/tree/tb-privacy-diagrams/2025-02%20Open%20Source%20Index. Once he finishes we can adapt the logic to already incorporate into the automatically created Insights projects in CM-2053",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:36.402Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6p6agC",
          "sourceParentId": "",
          "timestamp": "2025-02-13T10:45:18.000Z",
          "title": "Find a way to classify InsightsProjects into Collections",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:36.402Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2826",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        },
        {
          "id": "cdc516b8-cf52-4d54-9d82-8644593a95b3",
          "attributes": {
            "state": "open"
          },
          "body": "Automatically create Insights Projects from all CM sub-projects that have integrations connected (any platform).\nTo automatically generate settings:\n\nProject Name: Same as sub-project name\nDescription: Either get it from AI or use a placeholder. Ideally from AI\nLogo URL: If segment is connected to GitHub, we actually have a logo available in the integration settings, we can use that one. orgs[0].logo. If it's not connected to GitHub, we should add a placeholder image\nCollection: Automatically classify the p",
          "channel": "https://github.com/CrowdDotDev/crowd.dev",
          "conversationId": null,
          "createdAt": "2025-02-19T12:49:36.301Z",
          "createdById": null,
          "isContribution": true,
          "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
          "username": "joanagmaia",
          "objectMemberId": null,
          "objectMemberUsername": null,
          "organizationId": null,
          "parentId": null,
          "platform": "github",
          "score": 8,
          "segmentId": "e2c3321f-0d85-4a16-b603-66fd9f882a06",
          "sourceId": "I_kwDOHksjGM6p6YAx",
          "sourceParentId": "",
          "timestamp": "2025-02-13T10:40:49.000Z",
          "title": "Automatically create Insights Projects from CM sub-projects",
          "type": "issues-opened",
          "updatedAt": "2025-02-19T12:49:36.301Z",
          "updatedById": null,
          "url": "https://github.com/CrowdDotDev/crowd.dev/issues/2825",
          "display": {
            "default": "opened a new issue in <a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "short": "opened an issue",
            "channel": "<a href=\"https://github.com/CrowdDotDev/crowd.dev\" target=\"_blank\">/crowd.dev</a>",
            "formatter": {}
          },
          "member": {
            "id": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
            "displayName": "joanagmaia",
            "reach": 0,
            "joinedAt": "2022-09-27T10:26:14.000Z",
            "jobTitle": null,
            "numberOfOpenSourceContributions": 0,
            "isBot": false,
            "isTeamMember": true,
            "isOrganization": false,
            "score": -1,
            "attributes": {
              "bio": {
                "github": "",
                "default": ""
              },
              "url": {
                "github": "https://github.com/joanagmaia",
                "default": "https://github.com/joanagmaia"
              },
              "company": {
                "github": "",
                "default": ""
              },
              "location": {
                "github": "",
                "default": ""
              },
              "avatarUrl": {
                "github": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4",
                "default": "https://avatars.githubusercontent.com/u/20134207?u=31de39608590484fdbbc8df7db5c2d4569dd1737&v=4"
              },
              "isHireable": {
                "github": false,
                "default": false
              },
              "isTeamMember": {
                "default": true
              }
            },
            "identities": [
              {
                "id": "91faad16-f969-45b7-86f9-e2268fe7e9b8",
                "type": "username",
                "value": "joanagmaia",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": "MDQ6VXNlcjIwMTM0MjA3",
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-25T09:30:50.259625+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "1cf619e8-df03-4905-a06a-2d1542599277"
              },
              {
                "id": "bb4384f8-9211-4f63-9a85-b8557f31bebe",
                "type": "email",
                "value": "joana@crowd.dev",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-26T21:25:33.096093+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "d8eeb503-3d59-4b0f-a0d5-8ae504c221fc",
                "type": "email",
                "value": "132689129+debajoti@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:29.994263+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "deeda755-e637-4b0f-b47d-fcce01061484",
                "type": "email",
                "value": "128703909+alienishi@users.noreply.github.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T02:40:30.5107+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              },
              {
                "id": "6a2e8223-8967-4a18-b8cd-ed18628c763a",
                "type": "email",
                "value": "joanamaiaportugal@gmail.com",
                "memberId": "f5729100-ab0f-11ef-94e7-7f6b9b9da228",
                "platform": "github",
                "sourceId": null,
                "tenantId": "875c38bd-2b1b-4e91-ad07-0cfbabb4c49f",
                "verified": true,
                "createdAt": "2024-11-27T06:11:11.595605+00:00",
                "updatedAt": "2025-01-15T11:42:45.647204+00:00",
                "integrationId": "710a5165-5f44-4cff-aaea-b4fa318bbecd"
              }
            ],
            "maintainerRoles": [],
            "tags": []
          }
        }
      ],
      "limit": 10,
      "offset": 0
    }

    return mockData;//response.data;
  }
  

  static async listActivityTypes(segments) {
    const response = await authAxios.get(
      '/activity/type',
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }

  static async listActivityChannels(segments) {
    const response = await authAxios.get(
      '/activity/channel',
      {
        params: {
          segments,
        },
      },
    );

    return response.data;
  }
}
