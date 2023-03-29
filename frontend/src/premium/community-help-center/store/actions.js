import sharedActions from '@/shared/store/actions';
import { ConversationService } from '@/modules/conversation/conversation-service';
import Message from '@/shared/message/message';
import Errors from '@/shared/error/errors';

export default {
  ...sharedActions(
    'communityHelpCenter',
    ConversationService,
  ),
  async doPublishAll(
    { commit, dispatch },
    conversationIds,
  ) {
    try {
      commit('PUBLISH_ALL_STARTED');

      await ConversationService.publishAll(conversationIds);

      commit('PUBLISH_ALL_SUCCESS', conversationIds);

      Message.success(
        'Conversations published successfully',
      );
      dispatch('doFetch', { keepPagination: true });
    } catch (error) {
      Errors.handle(error);
      commit('PUBLISH_ALL_ERROR');
    }
  },

  async doUnpublishAll(
    { commit, dispatch },
    conversationIds,
  ) {
    try {
      commit('UNPUBLISH_ALL_STARTED');

      await ConversationService.unpublishAll(
        conversationIds,
      );

      commit('UNPUBLISH_ALL_SUCCESS', conversationIds);

      Message.success(
        'Conversations unpublished successfully',
      );
      dispatch('doFetch', { keepPagination: true });
    } catch (error) {
      Errors.handle(error);
      commit('UNPUBLISH_ALL_ERROR');
    }
  },
  async doPublish({ commit, getters, dispatch }, { id }) {
    try {
      commit('UPDATE_STARTED', id);
      const record = await ConversationService.update(id, {
        published: true,
      });
      dispatch('doFetch', {
        filter: getters.filter,
        rawFilter: getters.rawFilter,
      });
      commit('UPDATE_SUCCESS', record);
      Message.success('Conversation published successfully');
    } catch (error) {
      Errors.handle(error);
      commit('UPDATE_ERROR', id);
    }
  },

  async doUnpublish({ commit, getters, dispatch }, { id }) {
    try {
      commit('UPDATE_STARTED', id);
      const record = await ConversationService.update(id, {
        published: false,
      });
      dispatch('doFetch', {
        filter: getters.filter,
        rawFilter: getters.rawFilter,
      });
      commit('UPDATE_SUCCESS', record);
      Message.success(
        'Conversation unpublished successfully',
      );
    } catch (error) {
      Errors.handle(error);
      commit('UPDATE_ERROR', id);
    }
  },

  doOpenSettingsDrawer({ commit }) {
    commit('OPEN_SETTINGS_DRAWER');
  },

  doCloseSettingsDrawer({ commit }) {
    commit('CLOSE_SETTINGS_DRAWER');
  },
};
