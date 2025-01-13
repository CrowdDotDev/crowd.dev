import { TagService } from '@/modules/tag/tag-service';
import Errors from '@/shared/error/errors';
import { router } from '@/router';
import Message from '@/shared/message/message';

export default {
  namespaced: true,

  state: () => ({
    initLoading: false,
    saveLoading: false,
    record: null,
  }),

  getters: {
    record: (state) => state.record,
    initLoading: (state) => Boolean(state.initLoading),
    saveLoading: (state) => Boolean(state.saveLoading),
  },

  mutations: {
    RESET(state) {
      state.initLoading = false;
      state.saveLoading = false;
      state.record = null;
    },

    INIT_STARTED(state) {
      state.record = null;
      state.initLoading = true;
    },

    INIT_SUCCESS(state, payload) {
      state.record = payload;
      state.initLoading = false;
    },

    INIT_ERROR(state) {
      state.record = null;
      state.initLoading = false;
    },

    CREATE_STARTED(state) {
      state.saveLoading = true;
    },

    CREATE_SUCCESS(state) {
      state.saveLoading = false;
    },

    CREATE_ERROR(state) {
      state.saveLoading = false;
    },

    AUTOCOMPLETE_CREATE_STARTED(state) {
      state.saveLoading = true;
    },

    AUTOCOMPLETE_CREATE_SUCCESS(state) {
      state.saveLoading = false;
    },

    AUTOCOMPLETE_CREATE_ERROR(state) {
      state.saveLoading = false;
    },

    UPDATE_STARTED(state) {
      state.saveLoading = true;
    },

    UPDATE_SUCCESS(state) {
      state.saveLoading = false;
    },

    UPDATE_ERROR(state) {
      state.saveLoading = false;
    },
  },

  actions: {
    async doInit({ commit }, id) {
      try {
        commit('INIT_STARTED');

        let record = null;

        if (id) {
          record = await TagService.find(id);
        }

        commit('INIT_SUCCESS', record);
      } catch (error) {
        Errors.handle(error);
        commit('INIT_ERROR');
        router.push('/tag');
      }
    },

    async doCreate({ commit }, values) {
      try {
        commit('CREATE_STARTED');
        await TagService.create(values);
        commit('CREATE_SUCCESS');
        Message.success('Tag successfully saved');
        router.push('/tag');
      } catch (error) {
        Errors.handle(error);
        commit('CREATE_ERROR');
      }
    },

    async doAutocompleteCreate({ commit }, values) {
      try {
        commit('AUTOCOMPLETE_CREATE_STARTED');
        const responseData = await TagService.create(values);
        commit('AUTOCOMPLETE_CREATE_SUCCESS');
        return responseData;
      } catch (error) {
        Errors.handle(error);
        commit('AUTOCOMPLETE_CREATE_ERROR');
      }
      return null;
    },

    async doUpdate({ commit }, { id, values }) {
      try {
        commit('UPDATE_STARTED');

        await TagService.update(id, values);

        commit('UPDATE_SUCCESS');
        Message.success('Tag successfully saved');
        router.push('/tag');
      } catch (error) {
        Errors.handle(error);
        commit('UPDATE_ERROR');
      }
    },
  },
};
