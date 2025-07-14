import { TagService } from '@/modules/tag/tag-service';
import Errors from '@/shared/error/errors';
import { router } from '@/router';

import { MessageStore } from '@/shared/message/notification';

export default {
  namespaced: true,

  state: () => ({
    loading: false,
  }),

  getters: {
    loading: (state) => Boolean(state.loading),
  },

  mutations: {
    DESTROY_ALL_STARTED(state) {
      state.loading = true;
    },

    DESTROY_ALL_SUCCESS(state) {
      state.loading = false;
    },

    DESTROY_ALL_ERROR(state) {
      state.loading = false;
    },

    DESTROY_STARTED(state) {
      state.loading = true;
    },

    DESTROY_SUCCESS(state) {
      state.loading = false;
    },

    DESTROY_ERROR(state) {
      state.loading = false;
    },
  },

  actions: {
    async doDestroy({ commit, dispatch, rootGetters }, id) {
      try {
        commit('DESTROY_STARTED');

        await TagService.destroyAll([id]);

        commit('DESTROY_SUCCESS');

        MessageStore.success('Tag successfully deleted');

        router.push('/tag');

        dispatch(
          'tag/list/doFetch',
          rootGetters['tag/list/filter'],
          {
            root: true,
          },
        );
      } catch (error) {
        Errors.handle(error);
        commit('DESTROY_ERROR');
      }
    },

    async doDestroyAll(
      { commit, dispatch, rootGetters },
      ids,
    ) {
      try {
        commit('DESTROY_ALL_STARTED');

        await TagService.destroyAll(ids);

        commit('DESTROY_ALL_SUCCESS');

        dispatch('tag/list/doUnselectAll', null, {
          root: true,
        });

        MessageStore.success('Tag(s) successfully deleted');

        router.push('/tag');

        dispatch(
          'tag/list/doFetch',
          rootGetters['tag/list/filter'],
          {
            root: true,
          },
        );
      } catch (error) {
        Errors.handle(error);
        commit('DESTROY_ALL_ERROR');
      }
    },
  },
};
