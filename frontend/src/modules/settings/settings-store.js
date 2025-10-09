import { SettingsService } from '@/modules/settings/settings-service';
import Errors from '@/shared/error/errors';
import { router } from '@/router';

import { ToastStore } from '@/shared/message/notification';
import { AuthService } from '@/modules/auth/services/auth.service';

export default {
  namespaced: true,

  state: () => ({
    initLoading: false,
    saveLoading: false,
    settings: null,
  }),

  getters: {
    settings: (state) => state.settings,
    initLoading: (state) => Boolean(state.initLoading),
    saveLoading: (state) => Boolean(state.saveLoading),
  },

  mutations: {
    INIT_STARTED(state) {
      state.settings = null;
      state.initLoading = true;
    },

    INIT_SUCCESS(state, payload) {
      state.settings = payload;
      state.initLoading = false;
    },

    INIT_ERROR(state) {
      state.settings = null;
      state.initLoading = false;
    },

    SAVE_STARTED(state) {
      state.saveLoading = true;
    },

    SAVE_SUCCESS(state) {
      state.saveLoading = false;
    },

    SAVE_ERROR(state) {
      state.saveLoading = false;
    },
  },

  actions: {
    async doInit({ commit, rootGetters }) {
      if (
        !AuthService.getToken()
      ) {
        return;
      }

      try {
        commit('INIT_STARTED');

        const settings = await SettingsService.find();

        commit('INIT_SUCCESS', settings);
      } catch (error) {
        Errors.handle(error);
        commit('INIT_ERROR');
        router.push('/project-groups');
      }
    },

    async doSave({ commit }, values) {
      try {
        commit('SAVE_STARTED');
        const settings = await SettingsService.save(values);
        commit('SAVE_SUCCESS', settings);

        const secondsForReload = 3;

        ToastStore.success(`Settings successfully saved. The page will reload in ${secondsForReload} seconds for changes to take effect.`);

        /**
         * Theme change happens at boot time.
         * So to take effect the page must be reloaded
         */
        setTimeout(
          () => window.location.reload(),
          secondsForReload * 1000,
        );
      } catch (error) {
        Errors.handle(error);
        commit('SAVE_ERROR');
      }
    },
  },
};
