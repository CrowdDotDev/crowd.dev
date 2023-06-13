import { ActivityService } from '@/modules/activity/activity-service';
import Errors from '@/shared/error/errors';
import { router } from '@/router';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import { ConversationService } from '@/modules/conversation/conversation-service';
import buildApiPayload from '@/shared/filter/helpers/build-api-payload';
import sharedActions from '@/shared/store/actions';

export default {
  ...sharedActions('activity'),

  async doFetch(
    { commit, getters },
    { keepPagination = false },
  ) {
    try {
      const { activeView } = getters;

      commit('FETCH_STARTED', {
        keepPagination,
        activeView,
      });

      let response;

      if (getters.activeView.type === 'conversations') {
        response = await ConversationService.query({
          filter: buildApiPayload({
            customFilters: getters.activeView.filter,
            buildFilter: true,
          }),
          orderBy: getters.orderBy,
          limit: getters.limit,
          offset: getters.offset,
        });
      } else {
        response = await ActivityService.list({
          customFilters: getters.activeView.filter,
          orderBy: getters.orderBy,
          limit: getters.limit,
          offset: getters.offset,
        });
      }

      commit('FETCH_SUCCESS', {
        rows: response.rows,
        count: response.count,
        type: getters.activeView.type,
      });
    } catch (error) {
      Errors.handle(error);
      commit('FETCH_ERROR');
    }
  },

  async doFind({ commit, getters }, id) {
    try {
      commit('FIND_STARTED');

      let record;
      if (getters.activeView.type === 'conversations') {
        record = await ConversationService.find(id);
      } else {
        record = await ActivityService.find(id);
      }
      commit('FIND_SUCCESS', {
        record,
        type: getters.activeView.type,
      });
      return record;
    } catch (error) {
      Errors.handle(error);
      commit('FIND_ERROR');
      router.push('/activities');
    }
    return null;
  },

  async doDestroy({ commit, dispatch, getters }, id) {
    try {
      commit('DESTROY_STARTED');

      if (getters.activeView.type === 'conversations') {
        await ConversationService.destroyAll([id]);
      } else {
        await ActivityService.destroyAll([id]);
      }

      commit('DESTROY_SUCCESS', {
        id,
        type: getters.activeView.type,
      });

      Message.success(
        i18n('entities.activity.destroy.success'),
      );

      if (router.currentRoute.name === 'dashboard') {
        router.push({ name: 'activity' });
      }

      dispatch('doFetch', {});
    } catch (error) {
      Errors.handle(error);
      commit('DESTROY_ERROR');
    }
  },
};
