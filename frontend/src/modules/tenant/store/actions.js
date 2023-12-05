import sharedActions from '@/shared/store/actions';
import { TenantService } from '@/modules/tenant/tenant-service';
import Errors from '@/shared/error/errors';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';

export default {
  ...sharedActions('tenant', TenantService),
  async doCreate({ dispatch, commit }, values) {
    commit('CREATE_STARTED');
    return TenantService.create(values)
      .then((tenant) => {
        commit('CREATE_SUCCESS', tenant);
        return dispatch('auth/doSelectTenant', tenant, {
          root: true,
        });
      })
      .then(() => true)
      .catch((error) => {
        Errors.handle(error);
        commit('CREATE_ERROR');
        return false;
      });
  },

  async doUpdate(
    { commit, dispatch, state },
    { id, values },
  ) {
    try {
      state.saveLoading = true;
      commit('UPDATE_STARTED');

      const tenant = await TenantService.update(id, values);

      state.saveLoading = false;
      commit('UPDATE_SUCCESS', tenant);
      Message.success(i18n('tenant.update.success'));
      await dispatch('auth/doSelectTenant', { tenant }, {
        root: true,
      });
    } catch (error) {
      state.saveLoading = false;
      Errors.handle(error);
      commit('UPDATE_ERROR');
    }
  },

  doUpdateFeatureFlag({ commit }, { isReady, hasError }) {
    commit('UPDATE_FEATURE_FLAG', { isReady, hasError });
  },
};
