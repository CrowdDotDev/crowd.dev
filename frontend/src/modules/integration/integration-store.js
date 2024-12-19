import { IntegrationService } from '@/modules/integration/integration-service';
import Errors from '@/shared/error/errors';
import { router } from '@/router';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { isCurrentDateAfterGivenWorkingDays } from '@/utils/date';
import { showIntegrationProgressNotification } from '@/modules/integration/helpers/integration-progress-notification';
import Message from '../../shared/message/message';

export const ERROR_BANNER_WORKING_DAYS_DISPLAY = 3;

export default {
  namespaced: true,

  state: () => ({
    segmentId: null,
    byId: {},
    allIds: [],
    count: 0,
    loading: false,
    loaded: false,
  }),

  getters: {
    loadingFetch: (state) => state.loading,

    loadingFind: (state) => (id) => state.byId[id]?.loading,

    loaded: (state) => state.loaded,

    find: (state) => (id) => state.byId[id],

    findByPlatform: (state, getters) => (platform) => getters.array.find((w) => w.platform === platform),

    list: (state) => Object.keys(state.byId).reduce((acc, key) => {
      const integrationJsonData = CrowdIntegrations.getConfig(
        state.byId[key].platform,
      );
      acc[key] = {
        ...state.byId[key],
        ...integrationJsonData,
      };
      return acc;
    }, {}),

    listByPlatform: (state) => Object.keys(state.byId).reduce((acc, key) => {
      const integrationJsonData = CrowdIntegrations.getConfig(
        state.byId[key].platform,
      );
      acc[state.byId[key].platform] = {
        ...state.byId[key],
        ...integrationJsonData,
      };
      return acc;
    }, {}),

    array: (state, getters) => state.allIds.map((id) => getters.list[id]),

    active: (state, getters) => getters.array.filter(
      (i) => i.status === 'done' || i.status === 'in-progress',
    ),

    activeList: (state, getters) => getters.active.reduce((acc, item) => {
      acc[item.platform] = item;
      return acc;
    }, {}),

    inProgress: (state, getters) => getters.array.filter((i) => i.status === 'in-progress'),

    withErrors: (state, getters) => getters.array.filter(
      (i) => i.status === 'error'
          && isCurrentDateAfterGivenWorkingDays(
            i.updatedAt,
            ERROR_BANNER_WORKING_DAYS_DISPLAY,
          ),
    ),

    withNoData: (state, getters) => getters.array.filter((i) => i.status === 'no-data'),

    needsReconnect: (state, getters) => getters.array.filter((i) => i.status === 'needs-reconnect'),

    count: (state) => state.count,

    hasRows: (state, getters) => getters.count > 0,
  },

  mutations: {
    FETCH_STARTED(state) {
      state.loading = true;
    },

    FETCH_SUCCESS(state, payload) {
      state.loading = false;

      const byId = {};
      const allIds = [];

      payload.rows.forEach((integration) => {
        byId[integration.id] = integration;
        if (allIds.indexOf(integration.id) === -1) {
          allIds.push(integration.id);
        }
      });

      state.segmentId = router.currentRoute.value.params.id;
      state.byId = byId;
      state.allIds = allIds;
      state.count = payload.count;
      state.loaded = true;
    },

    FETCH_ERROR(state) {
      state.loading = false;
      state.rows = [];
      state.count = 0;
    },

    FIND_STARTED(state, id) {
      if (state.byId[id]) {
        state.byId[id].loading = true;
      }
    },

    FIND_SUCCESS(state, record) {
      if (!record) {
        return;
      }
      state.byId[record.id] = record;
      state.byId[record.id].loading = false;
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id);
      }
    },

    FIND_ERROR(state, id) {
      if (state.byId[id]) {
        state.byId[id].loading = false;
      }
    },

    CREATE_STARTED() {},

    CREATE_SUCCESS(state, record) {
      state.byId[record.id] = record;
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id);
        state.count += 1;
      }
    },

    CREATE_ERROR() {},

    UPDATE_STARTED() {},

    UPDATE_SUCCESS(state, record) {
      state.byId[record.id] = record;
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id);
        state.count += 1;
      }
    },

    UPDATE_ERROR() {},

    DESTROY_STARTED(state) {
      state.loading = true;
    },

    DESTROY_SUCCESS(state, id) {
      state.loading = false;
      delete state.byId[id];
      const index = state.allIds.indexOf(id);
      state.allIds.splice(index, 1);
      state.count -= 1;
    },

    DESTROY_ERROR(state) {
      state.loading = false;
    },

    DESTROY_ALL_STARTED(state) {
      state.loading = true;
    },

    DESTROY_ALL_SUCCESS(state) {
      state.loading = false;
      state.byId = {};
      state.allIds.splice(0);
      state.count = 0;
    },

    DESTROY_ALL_ERROR(state) {
      state.loading = false;
    },
  },

  actions: {
    async doFetch({ commit }, segments = []) {
      try {
        commit('FETCH_STARTED');

        const response = await IntegrationService.list(
          null,
          null,
          null,
          null,
          segments,
        );

        commit('FETCH_SUCCESS', {
          rows: response.rows,
          count: response.count,
        });
      } catch (error) {
        Errors.handle(error);
        commit('FETCH_ERROR');
      }
    },

    async doDestroy({ commit, dispatch }, integrationId) {
      try {
        commit('DESTROY_STARTED');

        await IntegrationService.destroyAll([integrationId]);
        Message.success('Integration was disconnected successfully');

        commit('DESTROY_SUCCESS', integrationId);
        dispatch('doFetch');
      } catch (error) {
        Errors.handle(error);
        commit('DESTROY_ERROR');
      }
    },

    async doDestroyAll({ commit }, integrationIds) {
      try {
        commit('DESTROY_ALL_STARTED');

        const response = await IntegrationService.destroyAll(integrationIds);

        commit('DESTROY_ALL_SUCCESS', response);
      } catch (error) {
        Errors.handle(error);
        commit('DESTROY_ALL_ERROR');
      }
    },

    async doFind({ commit }, id) {
      try {
        commit('FIND_STARTED', id);
        const record = await IntegrationService.find(id);
        commit('FIND_SUCCESS', record);
      } catch (error) {
        Errors.handle(error);
        commit('FIND_ERROR', id);
      }
    },

    async doGithubConnect(
      { commit, dispatch },
      { code, installId, setupAction },
    ) {
      // Function to trigger Oauth performance.
      try {
        commit('CREATE_STARTED');
        // Call the connect function in IntegrationService to handle functionality
        const integration = await IntegrationService.githubConnect(
          code,
          installId,
          setupAction,
        );
        const repos = integration?.settings?.repos || [];
        const data = repos.reduce(
          (a, b) => ({
            ...a,
            [b.url]: integration.segmentId,
          }),
          {},
        );

        dispatch('doFetch');

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });

        dispatch('doFetch', [integration.segmentId]);
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doRedditOnboard({ commit }, { subreddits }) {
      // Function to trigger Oauth performance.
      try {
        commit('CREATE_STARTED');
        // Call the connect function in IntegrationService to handle functionality
        const integration = await IntegrationService.redditOnboard(subreddits);

        commit('CREATE_SUCCESS', integration);

        showIntegrationProgressNotification('reddit', integration.segmentId);
        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doLinkedinConnect({ commit }) {
      try {
        commit('CREATE_STARTED');
        // Call the connect function in IntegrationService to handle functionality
        const integration = await IntegrationService.linkedinConnect();

        commit('CREATE_SUCCESS', integration);
        if (integration.settings?.organizations.length === 1) {
          showIntegrationProgressNotification(
            'linkedin',
            integration.segmentId,
          );
        }
        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doLinkedinOnboard({ commit }, organizationId) {
      try {
        commit('UPDATE_STARTED');
        // Call the connect function in IntegrationService to handle functionality
        const integration = await IntegrationService.linkedinOnboard(
          organizationId,
        );

        commit('UPDATE_SUCCESS', integration);

        showIntegrationProgressNotification('linkedin', integration.segmentId);

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('UPDATE_ERROR');
      }
    },

    async doDiscordConnect({ commit }, { guildId }) {
      // Function to connect to Discord. We just need to store the
      // guildId to be able to match bot events to users.
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.discordConnect(guildId);

        commit('CREATE_SUCCESS', integration);

        showIntegrationProgressNotification('discord', integration.segmentId);
        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doDevtoConnect({ commit }, { users, organizations, apiKey }) {
      // Function to connect to Dev.to. We just need to store the
      // users and organizations we want to track

      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.devtoConnect(
          users,
          organizations,
          apiKey,
        );

        commit('CREATE_SUCCESS', integration);

        showIntegrationProgressNotification('devto', integration.segmentId);

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doHackerNewsConnect({ commit }, { keywords, urls }) {
      // Function to connect to Dev.to. We just need to store the
      // users and organizations we want to track

      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.hackerNewsConnect(
          keywords,
          urls,
        );

        commit('CREATE_SUCCESS', integration);

        showIntegrationProgressNotification(
          'hackernews',
          integration.segmentId,
        );

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doStackOverflowOnboard({ commit }, {
      tags, keywords, segmentId, grandparentId,
    }) {
      // Function to connect to StackOverflow.

      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.stackOverflowOnboard(
          segmentId,
          tags,
          keywords,
        );

        commit('CREATE_SUCCESS', integration);

        showIntegrationProgressNotification(
          'stackoverflow',
          segmentId,
        );

        router.push({
          name: 'integration',
          params: {
            id: segmentId,
            grandparentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doHubspotConnect({ commit }) {
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.hubspotConnect();

        commit('CREATE_SUCCESS', integration);

        router.push('/integrations');
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doGitConnect({ commit }, {
      remotes, isUpdate, segmentId, grandparentId,
    }) {
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.gitConnect(remotes, [segmentId]);

        commit('CREATE_SUCCESS', integration);

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> '
            + 'This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: `Git integration ${
              isUpdate ? 'updated' : 'created'
            } successfully`,
          },
        );

        router.push({
          name: 'integration',
          params: {
            id: segmentId,
            grandparentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doConfluenceConnect({ commit }, { settings, isUpdate }) {
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.confluenceConnect(
          settings,
        );

        commit('CREATE_SUCCESS', integration);

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> '
            + 'This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: `Confluence integration ${
              isUpdate ? 'updated' : 'created'
            } successfully`,
          },
        );

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doGerritConnect(
      { commit },
      {
        orgURL, user, key, isUpdate, repoNames, enableAllRepos, enableGit,
      },
    ) {
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.gerritConnect({
          orgURL,
          user,
          key,
          repoNames,
          enableAllRepos,
          enableGit,
        });

        commit('CREATE_SUCCESS', integration);

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> '
            + 'This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: `Gerrit integration ${
              isUpdate ? 'updated' : 'created'
            } successfully`,
          },
        );

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doDiscourseConnect(
      { commit },
      {
        forumHostname, apiKey, webhookSecret, isUpdate,
      },
    ) {
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.discourseConnect(
          forumHostname,
          apiKey,
          webhookSecret,
        );

        commit('CREATE_SUCCESS', integration);

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> '
            + 'This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: `Discourse integration ${
              isUpdate ? 'updated' : 'created'
            } successfully`,
          },
        );

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doGroupsioConnect(
      { commit },
      {
        email, token, tokenExpiry, password, groups, isUpdate, autoImports,
      },
    ) {
      console.log('doGroupsioConnect', email, token, groups, isUpdate);

      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.groupsioConnect(
          email,
          token,
          tokenExpiry,
          password,
          groups,
          autoImports,
        );

        commit('CREATE_SUCCESS', integration);

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> '
            + 'This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: `
              groups.io integration ${
  isUpdate ? 'updated' : 'created'
} successfully`,
          },
        );

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        Message.error('Something went wrong. Please try again later.');
        commit('CREATE_ERROR');
      }
    },

    async doJiraConnect(
      { commit },
      {
        url, username, personalAccessToken, apiToken, projects, isUpdate,
      },
    ) {
      try {
        commit('CREATE_STARTED');

        const integration = await IntegrationService.jiraConnect(
          url,
          username,
          personalAccessToken,
          apiToken,
          projects,
        );

        commit('CREATE_SUCCESS', integration);

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> '
            + 'This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: `
              Jira integration ${
  isUpdate ? 'updated' : 'created'
} successfully`,
          },
        );

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });
      } catch (error) {
        Errors.handle(error);
        Message.error('Something went wrong. Please try again later.');
        commit('CREATE_ERROR');
      }
    },

    async doGitlabConnect({ commit, dispatch }, { code, state }) {
      try {
        commit('CREATE_STARTED');
        const integration = await IntegrationService.gitlabConnect(code, state);
        commit('CREATE_SUCCESS', integration);
        dispatch('doFetch');

        router.push({
          name: 'integration',
          params: {
            id: integration.segmentId,
          },
        });

        dispatch('doFetch', [integration.segmentId]);
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },
    async mapGitlabRepos(integrationId, mapping) {
      try {
        await IntegrationService.mapGitlabRepos(integrationId, mapping);
        await this.find(integrationId);
        Message.success('GitLab repositories mapped successfully');
      } catch (error) {
        console.error('Error mapping GitLab repositories:', error);
        Message.error('Failed to map GitLab repositories');
      }
    },
  },
};
