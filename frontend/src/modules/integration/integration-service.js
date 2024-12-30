import authAxios from '@/shared/axios/auth-axios';
import { AuthService } from '@/modules/auth/services/auth.service';
import { router } from '@/router';

const getSegments = () => ({ segments: [router.currentRoute.value.params.id] });

export class IntegrationService {
  static async update(id, data, segments = []) {
    const body = {
      ...data,
      ...getSegments(),
    };

    body.segments = segments.length ? segments : body.segments;

    const tenantId = AuthService.getTenantId();

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

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.delete(`/tenant/${tenantId}/integration`, {
      params,
    });

    return response.data;
  }

  static async create(data, segments = []) {
    const body = {
      ...data,
      ...getSegments(),
    };

    body.segments = segments.length ? segments : body.segments;

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/integration`,
      body,
    );

    return response.data;
  }

  static async find(id) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/${id}`,
      {
        params: getSegments(),
      },
    );

    return response.data;
  }

  static async list(filter, orderBy, limit, offset, segments) {
    const body = {
      filter,
      orderBy,
      limit,
      offset,
      ...(segments.length ? { segments } : getSegments()),
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/integration/query`,
      body,
    );

    return response.data;
  }

  static async devtoConnect(users, organizations, apiKey, segments) {
    // Getting the tenant_id
    const tenantId = AuthService.getTenantId();

    // Calling connect devto function in the backend.
    const response = await authAxios.post(`/tenant/${tenantId}/devto-connect`, {
      users,
      organizations,
      apiKey,
      ...getSegments(),
      segments,
    });

    return response.data;
  }

  static async devtoValidateAPIKey(apiKey) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(`/tenant/${tenantId}/devto-validate`, {
      params: {
        apiKey,
        ...getSegments(),
      },
    });

    return response.data;
  }

  static async hackerNewsConnect(keywords, urls, segments) {
    // Getting the tenant_id
    const tenantId = AuthService.getTenantId();

    // Calling connect devto function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/hackernews-connect`,
      {
        keywords,
        urls,
        ...getSegments(),
        segments,
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
    const tenantId = AuthService.getTenantId();
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(
      `/authenticate/${tenantId}/${code}`,
      body,
    );
    return response.data;
  }

  static async githubMapRepos(integrationId, mapping, segments, isUpdateTransaction = false) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.put(
      `/tenant/${tenantId}/integration/${integrationId}/github/repos`,
      {
        mapping,
        segments,
        isUpdateTransaction,
      },
    );
    return response.data;
  }

  static async fetchGitHubMappings(integration) {
    const tenantId = AuthService.getTenantId();
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

  static async fetchGitLabMappings(integration) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.get(
      `/tenant/${tenantId}/integration/${integration.id}/gitlab/repos`,
      {
        params: {
          segments: [integration.segmentId],
        },
      },
    );
    return response.data;
  }

  static async redditOnboard(subreddits, segmentId) {
    // Ask backend to connect to GitHub through Oauth.
    // Install_id is the GitHub app installation id.
    const body = {
      subreddits,
      segments: [segmentId],
    };
    // Getting the tenant_id
    const tenantId = AuthService.getTenantId();
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(`/reddit-onboard/${tenantId}`, body);
    return response.data;
  }

  static async linkedinConnect(segmentId) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.put(
      `/linkedin-connect/${tenantId}`,
      { segments: [segmentId] },
    );

    return response.data;
  }

  static async linkedinOnboard(organizationId, segmentId) {
    const body = {
      organizationId,
      segments: [segmentId],
    };

    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/linkedin-onboard/${tenantId}`,
      body,
    );

    return response.data;
  }

  static async discordConnect(guildId) {
    // Getting the tenant_id
    const tenantId = AuthService.getTenantId();
    // Calling the authenticate function in the backend.
    const response = await authAxios.put(
      `/discord-authenticate/${tenantId}/${guildId}`,
      getSegments(),
    );
    return response.data;
  }

  static async devtoValidateUser(username, apiKey) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(`/tenant/${tenantId}/devto-validate`, {
      params: {
        username,
        apiKey,
        ...getSegments(),
      },
    });

    return response.data;
  }

  static async devtoValidateOrganization(organization, apiKey) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(`/tenant/${tenantId}/devto-validate`, {
      params: {
        organization,
        apiKey,
        ...getSegments(),
      },
    });

    return response.data;
  }

  static async redditValidate(subreddit) {
    const tenantId = AuthService.getTenantId();

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
    const tenantId = AuthService.getTenantId();

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
    const tenantId = AuthService.getTenantId();

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

  static async stackOverflowOnboard(segmentId, tags, keywords) {
    // Getting the tenant_id
    const tenantId = AuthService.getTenantId();
    // Calling the authenticate function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/stackoverflow-connect`,
      {
        tags,
        keywords,
        segments: [segmentId],
      },
    );

    return response.data;
  }

  static async hubspotConnect() {
    // Getting the tenant_id
    const tenantId = AuthService.getTenantId();
    // Calling the authenticate function in the backend.
    const response = await authAxios.post(
      `/tenant/${tenantId}/hubspot-connect`,
      {},
    );

    return response.data;
  }

  static async gitConnect(remotes, segments = []) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.put(`/tenant/${tenantId}/git-connect`, {
      remotes,
      ...getSegments(),
      segments,
    });

    return response.data;
  }

  static async confluenceConnect(settings, segmentId) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.put(
      `/tenant/${tenantId}/confluence-connect`,
      {
        settings,
        segments: [segmentId],
      },
    );

    return response.data;
  }

  static async gerritConnect(remote, segments = []) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.put(`/tenant/${tenantId}/gerrit-connect`, {
      remote,
      ...getSegments(),
      segments,
    });

    return response.data;
  }

  static async discourseValidateAPI(forumHostname, apiKey) {
    const tenantId = AuthService.getTenantId();

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

  static async discourseConnect(forumHostname, apiKey, webhookSecret, segments = []) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/discourse-connect`,
      {
        forumHostname,
        apiKey,
        apiUsername: 'system',
        webhookSecret,
        ...getSegments(),
        segments,
      },
    );

    return response.data;
  }

  static async discourseSoftConnect(forumHostname, apiKey, webhookSecret) {
    const tenantId = AuthService.getTenantId();

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
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/discourse-test-webhook`,
      {
        integrationId,
      },
    );

    return response.data.isWebhooksReceived;
  }

  static async groupsioConnect(email, token, tokenExpiry, password, groups, autoImports, segments = []) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/groupsio-connect`,
      {
        email,
        token,
        tokenExpiry,
        password,
        groups,
        autoImports,
        ...getSegments(),
        segments,
      },
    );

    return response.data;
  }

  static async groupsioGetToken(email, password, twoFactorCode = null, segments = []) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/groupsio-get-token`,
      {
        email,
        password,
        twoFactorCode,
        ...getSegments(),
        segments,
      },
    );

    return response.data;
  }

  static async groupsioVerifyGroup(groupName, cookie) {
    const tenantId = AuthService.getTenantId();

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

  static async groupsioGetUserSubscriptions(cookie) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/groupsio-get-user-subscriptions`,
      {
        cookie,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async jiraConnect(
    url,
    username,
    personalAccessToken,
    apiToken,
    projects,
    segments = [],
  ) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(`/tenant/${tenantId}/jira-connect`, {
      url,
      username,
      personalAccessToken,
      apiToken,
      projects,
      ...getSegments(),
      segments,
    });

    return response.data;
  }

  static async fetchIntegrationsProgress(segments) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/integration/progress/list`,
      {
        segments: segments || undefined,
      },
    );

    return response.data;
  }

  static async githubConnectInstallation(installId) {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.post(
      `/tenant/${tenantId}/github-connect-installation`,
      {
        installId,
        ...getSegments(),
      },
    );

    return response.data;
  }

  static async getGithubInstallations() {
    const tenantId = AuthService.getTenantId();

    const response = await authAxios.get(
      `/tenant/${tenantId}/github-installations`,
      {
        params: getSegments(),
      },
    );

    return response.data;
  }

  static async gitlabConnect(code, state, segments = []) {
    const tenantId = AuthService.getTenantId();
    const response = await authAxios.get(`/gitlab/${tenantId}/callback`, {
      params: {
        code,
        state,
        ...getSegments(),
        segments,
      },
    });
    return response.data;
  }

  static async mapGitlabRepos(integrationId, mapping, projectIds, segments) {
    const response = await authAxios.put(
      `/tenant/${AuthService.getTenantId()}/integration/${integrationId}/gitlab/repos`,
      { mapping, projectIds, segments },
    );
    return response.data;
  }
}
