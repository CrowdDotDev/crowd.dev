import { IntegrationService } from '@/modules/integration/integration-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '../../shared/message/message'
import { CrowdIntegrations } from '@/integrations/integrations-config'

export default {
  namespaced: true,

  state: () => {
    return {
      byId: {},
      allIds: [],
      count: 0,
      loading: false,
      loaded: false
    }
  },

  getters: {
    loadingFetch: (state) => state.loading,

    loadingFind: (state) => (id) => {
      state.byId[id]?.loading
    },

    loaded: (state) => state.loaded,

    find: (state) => (id) => {
      return state.byId[id]
    },

    findByPlatform: (state, getters) => (platform) => {
      return getters.array.find(
        (w) => w.platform === platform
      )
    },

    list: (state) => {
      return Object.keys(state.byId).reduce((acc, key) => {
        const integrationJsonData =
          CrowdIntegrations.getConfig(
            state.byId[key].platform
          )
        acc[key] = {
          ...state.byId[key],
          ...integrationJsonData
        }
        return acc
      }, {})
    },

    listByPlatform: (state) => {
      return Object.keys(state.byId).reduce((acc, key) => {
        const integrationJsonData =
          CrowdIntegrations.getConfig(
            state.byId[key].platform
          )
        acc[state.byId[key].platform] = {
          ...state.byId[key],
          ...integrationJsonData
        }
        return acc
      }, {})
    },

    array: (state, getters) => {
      return state.allIds.map((id) => getters.list[id])
    },

    active: (state, getters) => {
      return getters.array.filter(
        (i) =>
          i.status === 'done' || i.status === 'in-progress'
      )
    },

    activeList: (state, getters) => {
      return getters.active.reduce((acc, item) => {
        acc[item.platform] = item
        return acc
      }, {})
    },

    inProgress: (state, getters) => {
      return getters.array.filter(
        (i) => i.status === 'in-progress'
      )
    },

    withErrors: (state, getters) => {
      return getters.array.filter(
        (i) => i.status === 'error'
      )
    },

    withNoData: (state, getters) => {
      return getters.array.filter(
        (i) => i.status === 'no-data'
      )
    },

    count: (state) => state.count,

    hasRows: (state, getters) => getters.count > 0
  },

  mutations: {
    FETCH_STARTED(state) {
      state.loading = true
    },

    FETCH_SUCCESS(state, payload) {
      state.loading = false
      for (let integration of payload.rows) {
        state.byId[integration.id] = integration
        if (state.allIds.indexOf(integration.id) === -1) {
          state.allIds.push(integration.id)
        }
      }
      state.count = payload.count
      state.loaded = true
    },

    FETCH_ERROR(state) {
      state.loading = false
      state.rows = []
      state.count = 0
    },

    FIND_STARTED(state, id) {
      if (state.byId[id]) {
        state.byId[id].loading = true
      }
    },

    FIND_SUCCESS(state, record) {
      if (!record) {
        return
      }
      record.loading = false
      state.byId[record.id] = record
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id)
      }
    },

    FIND_ERROR(state, id) {
      if (state.byId[id]) {
        state.byId[id].loading = false
      }
    },

    CREATE_STARTED() {},

    CREATE_SUCCESS(state, record) {
      state.byId[record.id] = record
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id)
        state.count++
      }
    },

    CREATE_ERROR() {},

    UPDATE_STARTED() {},

    UPDATE_SUCCESS(state, record) {
      state.byId[record.id] = record
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id)
        state.count++
      }
    },

    UPDATE_ERROR() {},

    DESTROY_STARTED(state) {
      state.loading = true
    },

    DESTROY_SUCCESS(state, id) {
      state.loading = false
      delete state.byId[id]
      const index = state.allIds.indexOf(id)
      state.allIds.splice(index, 1)
      state.count--
    },

    DESTROY_ERROR(state) {
      state.loading = false
    },

    DESTROY_ALL_STARTED(state) {
      state.loading = true
    },

    DESTROY_ALL_SUCCESS(state) {
      state.loading = false
      state.byId = {}
      state.allIds.splice(0)
      state.count = 0
    },

    DESTROY_ALL_ERROR(state) {
      state.loading = false
    }
  },

  actions: {
    async doFetch({ commit }) {
      try {
        commit('FETCH_STARTED')

        const response = await IntegrationService.list()

        commit('FETCH_SUCCESS', {
          rows: response.rows,
          count: response.count
        })
      } catch (error) {
        Errors.handle(error)
        commit('FETCH_ERROR')
      }
    },

    async doDestroy({ commit }, integrationId) {
      try {
        commit('DESTROY_STARTED')

        await IntegrationService.destroyAll([integrationId])
        Message.success(
          'Integration was disconnected successfully'
        )

        commit('DESTROY_SUCCESS', integrationId)
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ERROR')
      }
    },

    async doDestroyAll({ commit }, integrationIds) {
      try {
        commit('DESTROY_ALL_STARTED')

        const response =
          await IntegrationService.destroyAll(
            integrationIds
          )

        commit('DESTROY_ALL_SUCCESS', response)
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ALL_ERROR')
      }
    },

    async doFind({ commit }, id) {
      try {
        commit('FIND_STARTED', id)
        const record = await IntegrationService.find(id)
        commit('FIND_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('FIND_ERROR', id)
      }
    },

    async doGithubConnect(
      { commit },
      { code, install_id, setupAction }
    ) {
      // Function to trigger Oauth performance.
      try {
        commit('CREATE_STARTED')
        // Call the connect function in IntegrationService to handle functionality
        const integration =
          await IntegrationService.githubConnect(
            code,
            install_id,
            setupAction
          )

        commit('CREATE_SUCCESS', integration)
        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: 'GitHub integration created successfully'
          }
        )
        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    },

    async doRedditOnboard({ commit }, { subreddits }) {
      // Function to trigger Oauth performance.
      try {
        commit('CREATE_STARTED')
        // Call the connect function in IntegrationService to handle functionality
        const integration =
          await IntegrationService.redditOnboard(subreddits)

        commit('CREATE_SUCCESS', integration)
        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: 'Reddit integration created successfully'
          }
        )
        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    },

    async doLinkedinConnect({ commit }) {
      try {
        commit('CREATE_STARTED')
        // Call the connect function in IntegrationService to handle functionality
        const integration =
          await IntegrationService.linkedinConnect()

        commit('CREATE_SUCCESS', integration)
        if (
          integration.settings?.organizations.length === 1
        ) {
          Message.success(
            'The first activities will show up in a couple of seconds. <br /> <br /> This process might take a few minutes to finish, depending on the amount of data.',
            {
              title:
                'LinkedIn integration created successfully'
            }
          )
        }
        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    },

    async doLinkedinOnboard({ commit }, organizationId) {
      try {
        commit('UPDATE_STARTED')
        // Call the connect function in IntegrationService to handle functionality
        const integration =
          await IntegrationService.linkedinOnboard(
            organizationId
          )

        commit('UPDATE_SUCCESS', integration)
        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> This process might take a few minutes to finish, depending on the amount of data.',
          {
            title:
              'LinkedIn integration updated successfully'
          }
        )
        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('UPDATE_ERROR')
      }
    },

    async doDiscordConnect({ commit }, { guildId }) {
      // Function to connect to Discord. We just need to store the
      // guildId to be able to match bot events to users.
      try {
        commit('CREATE_STARTED')

        const integration =
          await IntegrationService.discordConnect(guildId)

        commit('CREATE_SUCCESS', integration)
        Message.success(
          'The first activities will show up in a couple of seconds. <br /> This process might take a few minutes to finish, depending on the amount of data.',
          {
            title:
              'Discord integration created successfully'
          }
        )
        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    },

    async doDevtoConnect(
      { commit },
      { users, organizations }
    ) {
      // Function to connect to Dev.to. We just need to store the
      // users and organizations we want to track

      try {
        commit('CREATE_STARTED')

        const integration =
          await IntegrationService.devtoConnect(
            users,
            organizations
          )

        commit('CREATE_SUCCESS', integration)

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> This process might take a few minutes to finish, depending on the amount of data.',
          {
            title: 'DEV integration created successfully'
          }
        )

        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    },

    async doHackerNewsConnect(
      { commit },
      { keywords, urls }
    ) {
      // Function to connect to Dev.to. We just need to store the
      // users and organizations we want to track

      try {
        commit('CREATE_STARTED')

        const integration =
          await IntegrationService.hackerNewsConnect(
            keywords,
            urls
          )

        commit('CREATE_SUCCESS', integration)

        Message.success(
          'The first activities will show up in a couple of seconds. <br /> <br /> This process might take a few minutes to finish, depending on the amount of data.',
          {
            title:
              'Hacker News integration created successfully'
          }
        )

        router.push('/integrations')
      } catch (error) {
        Errors.handle(error)
        commit('CREATE_ERROR')
      }
    }
  }
}
