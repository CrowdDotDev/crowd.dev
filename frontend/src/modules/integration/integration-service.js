import authAxios from '@/shared/axios/auth-axios';
import AuthCurrentTenant from '@/modules/auth/auth-current-tenant';
import { router } from '@/router';

const getSegments = () => ({ segments: [router.currentRoute.value.params.id] });

export class IntegrationService {
  static async update(id, data) {
    const body = {
      data,
      ...getSegments(),
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(
      `/tenant/${tenantId}/integration/${id}`,
      body,
    );

    return response.data;
  }

  static async destroyAll(ids) {
    const params = {
      ids,
      ...getSegments(),
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.delete(`/tenant/${tenantId}/integration`, {
      params,
    });

    return response.data;
  }

  static async create(data) {
    const body = {
      data,
      ...getSegments(),
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/integration`,
      body,
    );

    return response.data;
  }

  static async find(id) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/${id}`,
      {
        params: getSegments(),
      },
    );

    return response.data;
  }

  static async list(filter, orderBy, limit, offset, segments) {
    const params = {
      filter,
      orderBy,
      limit,
      offset,
      ...(segments.length ? { segments } : getSegments()),
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(`/tenant/${tenantId}/integration`, {
      params,
    });

    return response.data;
  }

  static async devtoConnect(users, organizations) {
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();

    // Calling connect devto function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/devto-connect`,
      {
        users,
        organizations,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async hackerNewsConnect(keywords, urls) {
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();

    // Calling connect devto function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/hackernews-connect`,
      {
        keywords,
        urls,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async githubConnect(code, installId, setupAction) {
    // Ask backend to connect to GitHub through Oauth.
    // Install_id is the GitHub app installation id.
    const body = {
      installId,
      setupAction,
      ...getSegments(),
    };
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(
      `/authenticate/${tenantId}/${code}`,
      body,
    );
    return response.data;
  }

  static async githubMapRepos(integrationId, mapping, segments) {
    const tenantId = AuthCurrentTenant.get();
    const response = await authAxios.put(
      `/tenant/${tenantId}/integration/${integrationId}/github/repos`,
      {
        mapping,
        segments,
      },
    );
    return response.data;
  }

  static async fetchGitHubMappings(integration) {
    const tenantId = AuthCurrentTenant.get();
    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/${integration.id}/github/repos`,
      {
        params: {
          segments: [integration.segmentId],
        },
      },
    );
    return response.data;
  }

  static async redditOnboard(subreddits) {
    // Ask backend to connect to GitHub through Oauth.
    // Install_id is the GitHub app installation id.
    const body = {
      subreddits,
      ...getSegments(),
    };
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(`/reddit-onboard/${tenantId}`, body);
    return response.data;
  }

  static async linkedinConnect() {
    const tenantId = AuthCurrentTenant.get();
    const response = await authAxios.put(
      `/linkedin-connect/${tenantId}`,
      getSegments(),
    );

    return response.data;
  }

  static async linkedinOnboard(organizationId) {
    const body = {
      organizationId,
      ...getSegments(),
    };

    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/linkedin-onboard/${tenantId}`,
      body,
    );

    return response.data;
  }

  static async discordConnect(guildId) {
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(
      `/discord-authenticate/${tenantId}/${guildId}`,
      getSegments(),
    );
    return response.data;
  }

  static async devtoValidateUser(username) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/devto-validate`,
      {
        params: {
          username,
          ...getSegments(),
        },
      },
    );

    return response.data;
  }

  static async devtoValidateOrganization(organization) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/devto-validate`,
      {
        params: {
          organization,
          ...getSegments(),
        },
      },
    );

    return response.data;
  }

  static async redditValidate(subreddit) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/reddit-validate`,
      {
        params: {
          subreddit,
          ...getSegments(),
        },
      },
    );

    return response.data;
  }

  static async stackOverflowValidate(tag) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/stackoverflow-validate`,
      {
        params: {
          tag,
          ...getSegments(),
        },
      },
    );

    return response.data;
  }

  static async stackOverflowVolume(keywords) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.get(
      `/tenant/${tenantId}/stackoverflow-volume`,
      {
        params: {
          keywords,
          ...getSegments(),
        },
      },
    );

    return response.data.total;
  }

  static async stackOverflowOnboard(tags, keywords) {
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();
    // Calling the authenticate function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/stackoverflow-connect`,
      {
        tags,
        keywords,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async hubspotConnect() {
    // Getting the tenant_id
    const tenantId = AuthCurrentTenant.get();
    // Calling the authenticate function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/hubspot-connect`,
      {
      },
    );

    return response.data;
  }

  static async gitConnect(remotes) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.put(`/tenant/${tenantId}/git-connect`, {
      remotes,
      ...getSegments(),
    });

    return response.data;
  }

  static async discourseValidateAPI(forumHostname, apiKey) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/discourse-validate`,
      {
        forumHostname,
        apiKey,
        apiUsername: 'system',
        ...getSegments(),
      },
    );

    return response.status === 200;
  }

  static async discourseConnect(forumHostname, apiKey, webhookSecret) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/discourse-connect`,
      {
        forumHostname,
        apiKey,
        apiUsername: 'system',
        webhookSecret,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async discourseSoftConnect(forumHostname, apiKey, webhookSecret) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/discourse-soft-connect`,
      {
        forumHostname,
        apiKey,
        apiUsername: 'system',
        webhookSecret,
      },
    );

    return response.data.id;
  }

  static async discourseVerifyWebhook(integrationId) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/discourse-test-webhook`,
      {
        integrationId,
      },
    );

    return response.data.isWebhooksReceived;
  }

  static async groupsioConnect(email, token, groupNames) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/groupsio-connect`,
      {
        email,
        token,
        groupNames,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async groupsioGetToken(email, password, twoFactorCode = null) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/groupsio-get-token`,
      {
        email,
        password,
        twoFactorCode,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async groupsioVerifyGroup(groupName, cookie) {
    const tenantId = AuthCurrentTenant.get();

    const response = await authAxios.post(
      `/tenant/${tenantId}/groupsio-verify-group`,
      {
        groupName,
        cookie,
        ...getSegments(),
      },
    );

    return response.data;
  }
}
