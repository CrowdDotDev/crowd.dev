import pluralize from 'pluralize';
import { MemberService } from '@/modules/member/member-service';
import Errors from '@/shared/error/errors';
import { router } from '@/router';
import Message from '@/shared/message/message';
import { i18n } from '@/i18n';
import { FormSchema } from '@/shared/form/form-schema';
import sharedActions from '@/shared/store/actions';
import {
  getEnrichmentMax,
  checkEnrichmentLimit,
  showEnrichmentSuccessMessage,
  showEnrichmentLoadingMessage,
  checkEnrichmentPlan,
} from '@/modules/member/member-enrichment';
import {
  getExportMax,
  showExportLimitDialog,
  showExportDialog,
} from '@/modules/member/member-export-limit';
import { MemberModel } from '../member-model';

export default {
  ...sharedActions('member', MemberService),

  async doExport(
    {
      commit, getters, rootGetters, dispatch,
    },
    {
      selected = false,
      customIds = [],
      customFilter = null,
      count = null,
      segments = [],
    } = {},
  ) {
    let filter;

    if (selected) {
      const ids = customIds.length
        ? customIds
        : getters.selectedRows.map((i) => i.id);

      filter = {
        id: {
          in: ids,
        },
      };
    } else if (customFilter) {
      filter = customFilter;
    } else {
      filter = getters.activeView.filter;
    }

    try {
      commit('EXPORT_STARTED', filter);

      commit('EXPORT_SUCCESS');
      const currentTenant = rootGetters['auth/currentTenant'];

      const tenantCsvExportCount = currentTenant.csvExportCount;
      const planExportCountMax = getExportMax(currentTenant.plan);

      await showExportDialog({
        tenantCsvExportCount,
        planExportCountMax,
        badgeContent:
          selected || count
            ? pluralize('member', count || getters.selectedRows.length, true)
            : `View: ${getters.activeView.label}`,
      });

      await MemberService.export({
        filter,
        orderBy: getters.orderBy,
        limit: 0,
        offset: null,
        segments,
        buildFilter: !selected && !customFilter, // build API payload if selected === false || !customFilter
      });

      await dispatch('auth/doRefreshCurrentUser', null, {
        root: true,
      });

      Message.success('CSV download link will be sent to your e-mail');
    } catch (error) {
      commit('EXPORT_ERROR');
      console.error(error);

      if (error.response?.status === 403) {
        const currentTenant = rootGetters['auth/currentTenant'];
        const planExportCountMax = getExportMax(currentTenant.plan);

        showExportLimitDialog({ planExportCountMax });
      } else if (error !== 'cancel') {
        Message.error(
          'An error has occured while trying to export the CSV file. Please try again',
          {
            title: 'CSV Export failed',
          },
        );
      }
    }
  },

  async doMarkAsTeamMember({ dispatch, getters }, value) {
    try {
      const { selectedRows } = getters;

      selectedRows.forEach((row) => {
        MemberService.update(row.id, {
          attributes: {
            ...row.attributes,
            isTeamMember: {
              default: value,
            },
          },
        });
      });

      dispatch('doFetch', {
        keepPagination: true,
      });

      Message.success(
        `Member${selectedRows.length > 1 ? 's' : ''} updated successfully`,
      );
    } catch (error) {
      Errors.handle(error);
    }
  },

  async doDestroyCustomAttributes({ commit, dispatch }, id) {
    try {
      commit('DESTROY_CUSTOM_ATTRIBUTES_STARTED');
      const response = await MemberService.destroyCustomAttribute(id);
      commit('DESTROY_CUSTOM_ATTRIBUTES_SUCCESS', response);

      dispatch('doFetchCustomAttributes');
    } catch (error) {
      Errors.handle(error);
      commit('DESTROY_CUSTOM_ATTRIBUTES_ERROR');
    }
  },

  async doUpdateCustomAttributes({ commit, dispatch }, { id, data }) {
    try {
      commit('UPDATE_CUSTOM_ATTRIBUTES_STARTED');
      const response = await MemberService.updateCustomAttribute(id, data);
      commit('UPDATE_CUSTOM_ATTRIBUTES_SUCCESS', response);

      dispatch('doFetchCustomAttributes');
    } catch (error) {
      Errors.handle(error);
      commit('UPDATE_CUSTOM_ATTRIBUTES_ERROR');
    }
  },

  async doFetchCustomAttributes({ commit }) {
    try {
      commit('FETCH_CUSTOM_ATTRIBUTES_STARTED');
      const response = await MemberService.fetchCustomAttributes();
      commit('FETCH_CUSTOM_ATTRIBUTES_SUCCESS', response);
    } catch (error) {
      Errors.handle(error);
      commit('FETCH_CUSTOM_ATTRIBUTES_ERROR');
    }
  },

  async doCreateCustomAttributes({ commit, dispatch }, values) {
    try {
      commit('CREATE_ATTRIBUTES_STARTED');
      const response = await MemberService.createCustomAttributes(values);

      dispatch('doFetchCustomAttributes');
      commit('CREATE_ATTRIBUTES_SUCCESS');

      return response;
    } catch (error) {
      if (error.response.status !== 500) {
        Errors.handle(error);
      }
      commit('CREATE_ATTRIBUTES_ERROR');

      Message.error(i18n('entities.member.attributes.error'));
    }
    return null;
  },

  async doMerge({ commit }, { memberToKeep, memberToMerge }) {
    try {
      commit('MERGE_STARTED', {
        memberToKeep,
        memberToMerge,
      });

      await MemberService.merge(memberToKeep, memberToMerge);

      commit('MERGE_SUCCESS', {
        memberToDelete: memberToMerge.id,
      });

      Message.success(i18n('entities.member.merge.success'));
      router.push(`/members/${memberToKeep.id}`);
    } catch (error) {
      Errors.handle(error);
      commit('MERGE_ERROR');
    }
  },

  async doBulkUpdateMembersTags(
    { commit },
    { members, tagsInCommon, tagsToSave },
  ) {
    const { fields } = MemberModel;
    const formSchema = new FormSchema([
      fields.username,
      fields.info,
      fields.tags,
      fields.emails,
    ]);

    try {
      commit('BULK_UPDATE_MEMBERS_TAGS_STARTED', {
        members,
        tagsInCommon,
        tagsToSave,
      });
      const payload = members.reduce((acc, item) => {
        const memberToUpdate = { ...item };
        const tagsToKeep = item.tags.filter(
          (tag) => tagsInCommon.filter((t) => t.id === tag.id).length === 0
            && tagsToSave.filter((t) => t.id === tag.id).length === 0,
        );

        memberToUpdate.tags = [...tagsToKeep, ...tagsToSave];
        acc.push(
          formSchema.cast({
            id: memberToUpdate.id,
            tags: memberToUpdate.tags,
          }),
        );
        return acc;
      }, []);
      const updatedMembers = await MemberService.updateBulk(payload);
      commit('BULK_UPDATE_MEMBERS_TAGS_SUCCESS', updatedMembers);
    } catch (error) {
      Errors.handle(error);
      commit('BULK_UPDATE_MEMBERS_TAGS_ERROR');
    }
  },

  async doEnrich({ commit, dispatch, rootGetters }, id, segments) {
    try {
      const currentTenant = rootGetters['auth/currentTenant'];

      const planEnrichmentCountMax = getEnrichmentMax(currentTenant.plan);

      // Check if it has reached enrichment maximum
      // If so, show dialog to upgrade plan
      if (checkEnrichmentLimit(planEnrichmentCountMax)) {
        return;
      }

      // Start member enrichment
      commit('UPDATE_STARTED');

      // Show enrichment loading message
      showEnrichmentLoadingMessage({ isBulk: false });

      const response = await MemberService.enrichMember(id, segments);

      commit('UPDATE_SUCCESS', response);

      await dispatch('auth/doRefreshCurrentUser', null, {
        root: true,
      });

      const updatedTenant = rootGetters['auth/currentTenant'];

      // Show enrichment success message
      showEnrichmentSuccessMessage({
        memberEnrichmentCount: updatedTenant.memberEnrichmentCount,
        planEnrichmentCountMax,
        plan: currentTenant.plan,
        isBulk: false,
      });

      if (router.currentRoute.value.name !== 'memberView') {
        router.push({
          name: 'memberView',
          params: {
            id,
          },
        });
      } else {
        await dispatch('doFind', id);
      }
    } catch (error) {
      Message.closeAll();
      Errors.handle(error);

      commit('UPDATE_ERROR');
    }
  },

  async doBulkEnrich({ rootGetters, dispatch }, ids) {
    try {
      const currentTenant = rootGetters['auth/currentTenant'];

      const { memberEnrichmentCount } = currentTenant;
      const planEnrichmentCountMax = getEnrichmentMax(currentTenant.plan);

      // Check if it is trying to enrich more members than
      // the number available for the current tenant plan
      if (
        checkEnrichmentPlan({
          enrichmentCount: memberEnrichmentCount + ids.length,
          planEnrichmentCountMax,
        })
      ) {
        return;
      }

      // Check if it has reached enrichment maximum
      // If so, show dialog to upgrade plan
      if (checkEnrichmentLimit(planEnrichmentCountMax)) {
        return;
      }

      if (ids.length === 1) {
        // showEnrichmentLoadingMessage({ isBulk: false });
        console.log('here');
        await MemberService.enrichMember(ids[0]);
      } else {
        // Show enrichment loading message
        showEnrichmentLoadingMessage({ isBulk: true });
        await MemberService.enrichMemberBulk(ids);
      }

      await dispatch('doFetchCustomAttributes');
    } catch (error) {
      Message.closeAll();
      Errors.handle(error);
    }
  },
};
