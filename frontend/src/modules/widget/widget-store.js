import cubejs from '@cubejs-client/core';
import { WidgetService } from '@/modules/widget/widget-service';
import Errors from '@/shared/error/errors';
import config from '@/config';

const CUBE_API_URL = config.cubejsUrl;

export default {
  namespaced: true,

  state: () => ({
    byId: {},
    allIds: [],
    count: 0,
    loading: false,
    cubejsToken: null,
  }),

  getters: {
    cubejsToken: (state) => state.cubejsToken,
    cubejsApi: (state) => (state.cubejsToken
      ? cubejs(state.cubejsToken, {
        apiUrl: `${CUBE_API_URL}/cubejs-api/v1`,
      })
      : null),

    loadingFetch: (state) => state.loading,

    loadingFind: (state) => (id) => state.byId[id].loading,

    find: (state) => (id) => state.byId[id],

    findByType: (state, getters) => (type) => getters.array.find((w) => w.type === type),

    list: (state) => state.byId,

    array: (state) => state.allIds.map((id) => state.byId[id]),

    count: (state) => state.count,

    hasRows: (state, getters) => getters.count > 0,
  },

  mutations: {
    RESETED(state) {
      state.byId = {};
      state.allIds = [];
      state.count = 0;
      state.loading = false;
      state.cubejsToken = null;
    },

    FETCH_STARTED(state) {
      state.loading = true;
    },

    FETCH_SUCCESS(state, payload) {
      state.loading = false;
      const widgets = payload.rows.filter(
        (w) => w.type !== 'cubejs',
      );
      widgets.forEach((widget) => {
        if (state.byId[widget.id].cache === null) {
          state.byId[widget.id].cache = widget.type.includes('graph')
            ? { x: [], y: [] }
            : [];
        }
        state.byId[widget.id] = widget;
        if (state.allIds.indexOf(widget.id) === -1) {
          state.allIds.push(widget.id);
        }
      });
      state.count = widgets.length;
    },

    FETCH_ERROR(state) {
      state.loading = false;
      state.rows = [];
      state.count = 0;
    },

    FIND_STARTED(state, id) {
      state.byId[id].loading = true;
    },

    FIND_SUCCESS(state, record) {
      state.byId[record.id].loading = false;
      state.byId[record.id] = record;
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id);
      }
    },

    FIND_ERROR(state, id) {
      state.byId[id].loading = false;
    },

    CREATE_STARTED(state) {
      state.loading = true;
    },

    CREATE_SUCCESS(state, record) {
      state.loading = false;
      state.byId[record.id] = record;
      if (state.allIds.indexOf(record.id) === -1) {
        state.allIds.push(record.id);
      }
      state.count += 1;
    },

    CREATE_ERROR(state) {
      state.loading = false;
    },

    UPDATE_SETTINGS_STARTED(state, id) {
      state.byId[id].loading = true;
    },

    UPDATE_SETTINGS_SUCCESS(state, record) {
      state.byId[record.id].loading = false;
      state.byId[record.id] = record;
    },

    UPDATE_SETTINGS_ERROR(state, id) {
      state.byId[id].loading = false;
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

    GET_CUBE_TOKEN_STARTED() {},

    GET_CUBE_TOKEN_SUCCESS(state, token) {
      state.cubejsToken = token;
    },

    GET_CUBE_TOKEN_ERROR() {},
  },

  actions: {
    async doResetStore({ commit }) {
      commit('RESETED');
    },
    async doFetch({ commit }) {
      try {
        commit('FETCH_STARTED');

        const response = await WidgetService.list();

        commit('FETCH_SUCCESS', {
          rows: response.rows,
          count: response.count,
        });
      } catch (error) {
        Errors.handle(error);
        commit('FETCH_ERROR');
      }
    },

    async doCreate({ commit }, widget) {
      try {
        commit('CREATE_STARTED');

        const response = await WidgetService.create(widget);

        commit('CREATE_SUCCESS', response);
      } catch (error) {
        Errors.handle(error);
        commit('FETCH_ERROR');
      }
    },

    async doDestroyAll({ commit }, widgetIds) {
      try {
        commit('DESTROY_ALL_STARTED');

        const response = await WidgetService.destroyAll(
          widgetIds,
        );

        commit('DESTROY_ALL_SUCCESS', response);
      } catch (error) {
        Errors.handle(error);
        commit('DESTROY_ALL_ERROR');
      }
    },

    async doFind({ commit }, id) {
      try {
        commit('FIND_STARTED', id);
        const record = await WidgetService.find(id);
        commit('FIND_SUCCESS', record);
      } catch (error) {
        Errors.handle(error);
        commit('FIND_ERROR', id);
      }
    },

    async updateSettings({ commit }, { id, data }) {
      try {
        commit('UPDATE_SETTINGS_STARTED', id);
        const record = await WidgetService.update(id, data);
        commit('UPDATE_SETTINGS_SUCCESS', record);
      } catch (error) {
        Errors.handle(error);
        commit('UPDATE_SETTINGS_ERROR', id);
      }
    },

    async getCubeToken({ commit }) {
      try {
        commit('GET_CUBE_TOKEN_STARTED');

        const token = await WidgetService.getCubeToken();

        commit('GET_CUBE_TOKEN_SUCCESS', token);
      } catch (error) {
        Errors.handle(error);
        commit('GET_CUBE_TOKEN_ERROR');
      }
    },
  },
};
