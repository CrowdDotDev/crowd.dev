import { MemberService } from '@/modules/member/member-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { MemberModel } from '../member-model'
import { FormSchema } from '@/shared/form/form-schema'
import sharedActions from '@/shared/store/actions'
import ConfirmDialog from '@/shared/dialog/confirm-dialog'
import {
  getEnrichmentMax,
  checkEnrichmentLimit,
  showEnrichmentSuccessMessage,
  showEnrichmentErrorMessage,
  showEnrichmentLoadingMessage
} from '@/modules/member/member-enrichment'

export default {
  ...sharedActions('member', MemberService),

  async doExport(
    { commit, getters, rootGetters, dispatch },
    selected = false
  ) {
    let filter
    if (selected) {
      filter = {
        id: {
          in: [getters.selectedRows.map((i) => i.id)]
        }
      }
    } else {
      filter = getters.activeView.filter
    }

    try {
      commit('EXPORT_STARTED', filter)

      commit('EXPORT_SUCCESS')
      const currentTenant =
        rootGetters['auth/currentTenant']

      const tenantCsvExportCount =
        currentTenant.csvExportCount
      let planCsvExportMax = 2
      if (currentTenant.plan === 'Growth') {
        planCsvExportMax = 10
      } else if (currentTenant.plan === 'Custom') {
        planCsvExportMax = 'unlimited'
      }

      await ConfirmDialog({
        vertical: true,
        type: 'info',
        title: 'Export CSV',
        message:
          'Receive in your inbox a link to download the CSV file ',
        icon: 'ri-file-download-line',
        confirmButtonText: 'Send download link to e-mail',
        cancelButtonText: 'Cancel',
        badgeContent: selected
          ? `${getters.selectedRows.length} member${
              getters.selectedRows.length === 1 ? '' : 's'
            }`
          : `View: ${getters.activeView.label}`,
        highlightedInfo: `${tenantCsvExportCount}/${planCsvExportMax} exports available in this plan used`
      })

      await MemberService.export(
        filter,
        getters.orderBy,
        0,
        null,
        !selected // build API payload if selected === false
      )

      await dispatch(`auth/doRefreshCurrentUser`, null, {
        root: true
      })

      Message.success(
        'CSV download link will be sent to your e-mail'
      )
    } catch (error) {
      commit('EXPORT_ERROR')

      console.log(error)
      if (error.response?.status === 403) {
        await ConfirmDialog({
          vertical: true,
          type: 'danger',
          title:
            'You have reached the limit of 2 CSV exports per month on your current plan',
          message:
            'Upgrade your plan to get unlimited CSV exports per month and take full advantage of this feature',
          confirmButtonText: 'Upgrade plan',
          showCancelButton: false
        })
        router.push('settings?activeTab=plans')
      } else if (error !== 'cancel') {
        Message.error(
          'An error has occured while trying to export the CSV file. Please try again',
          {
            title: 'CSV Export failed'
          }
        )
      }
    }
  },

  async doMarkAsTeamMember({ dispatch, getters }) {
    try {
      const selectedRows = getters.selectedRows

      for (const row of selectedRows) {
        await MemberService.update(row.id, {
          attributes: {
            ...row.attributes,
            isTeamMember: {
              crowd: true,
              default: true
            }
          }
        })
      }

      dispatch('doFetch', {
        keepPagination: true
      })

      Message.success(
        `Member${
          selectedRows.length > 1 ? 's' : ''
        } updated successfully`
      )
    } catch (error) {
      Errors.handle(error)
    }
  },

  async doDestroyCustomAttributes(
    { commit, dispatch },
    id
  ) {
    try {
      commit('DESTROY_CUSTOM_ATTRIBUTES_STARTED')
      const response =
        await MemberService.destroyCustomAttribute(id)
      commit('DESTROY_CUSTOM_ATTRIBUTES_SUCCESS', response)

      dispatch('doFetchCustomAttributes')
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_CUSTOM_ATTRIBUTES_ERROR')
    }
  },

  async doUpdateCustomAttributes(
    { commit, dispatch },
    { id, data }
  ) {
    try {
      commit('UPDATE_CUSTOM_ATTRIBUTES_STARTED')
      const response =
        await MemberService.updateCustomAttribute(id, data)
      commit('UPDATE_CUSTOM_ATTRIBUTES_SUCCESS', response)

      dispatch('doFetchCustomAttributes')
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_CUSTOM_ATTRIBUTES_ERROR')
    }
  },

  async doFetchCustomAttributes({ commit }) {
    try {
      commit('FETCH_CUSTOM_ATTRIBUTES_STARTED')
      const response =
        await MemberService.fetchCustomAttributes()
      commit('FETCH_CUSTOM_ATTRIBUTES_SUCCESS', response)
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_CUSTOM_ATTRIBUTES_ERROR')
    }
  },

  async doCreateCustomAttributes(
    { commit, dispatch },
    values
  ) {
    try {
      commit('CREATE_ATTRIBUTES_STARTED')
      const response =
        await MemberService.createCustomAttributes(values)

      dispatch('doFetchCustomAttributes')
      commit('CREATE_ATTRIBUTES_SUCCESS')

      return response
    } catch (error) {
      if (error.response.status !== 500) {
        Errors.handle(error)
      }
      commit('CREATE_ATTRIBUTES_ERROR')

      Message.error(
        i18n('entities.member.attributes.error')
      )
    }
  },

  async doMerge(
    { commit },
    { memberToKeep, memberToMerge }
  ) {
    try {
      commit('MERGE_STARTED', {
        memberToKeep,
        memberToMerge
      })

      await MemberService.merge(memberToKeep, memberToMerge)

      commit('MERGE_SUCCESS', {
        memberToDelete: memberToMerge.id
      })

      Message.success(i18n('entities.member.merge.success'))
      router.push(`/members/${memberToKeep.id}`)
    } catch (error) {
      Errors.handle(error)
      commit('MERGE_ERROR')
    }
  },

  async doBulkUpdateMembersTags(
    { commit },
    { members, tagsInCommon, tagsToSave }
  ) {
    const { fields } = MemberModel
    const formSchema = new FormSchema([
      fields.username,
      fields.info,
      fields.tags,
      fields.email
    ])

    try {
      commit('BULK_UPDATE_MEMBERS_TAGS_STARTED', {
        members,
        tagsInCommon,
        tagsToSave
      })
      const payload = members.reduce((acc, item) => {
        const memberToUpdate = { ...item }
        const tagsToKeep = item.tags.filter((tag) => {
          return (
            tagsInCommon.filter((t) => t.id === tag.id)
              .length === 0 &&
            tagsToSave.filter((t) => t.id === tag.id)
              .length === 0
          )
        })

        memberToUpdate.tags = [...tagsToKeep, ...tagsToSave]
        acc.push(
          formSchema.cast({
            id: memberToUpdate.id,
            tags: memberToUpdate.tags
          })
        )
        return acc
      }, [])
      const updatedMembers = await MemberService.updateBulk(
        payload
      )
      commit(
        'BULK_UPDATE_MEMBERS_TAGS_SUCCESS',
        updatedMembers
      )
    } catch (error) {
      Errors.handle(error)
      commit('BULK_UPDATE_MEMBERS_TAGS_ERROR')
    }
  },

  async doEnrich({ commit, dispatch, rootGetters }, id) {
    try {
      const currentTenant =
        rootGetters['auth/currentTenant']

      const { memberEnrichmentCount } = currentTenant
      const planEnrichmentCountMax = getEnrichmentMax(
        currentTenant.plan
      )

      // Check if it has reached enrichment maximum
      // If so, show dialog to upgrade plan
      checkEnrichmentLimit(
        memberEnrichmentCount,
        planEnrichmentCountMax
      )

      // Start member enrichment
      commit('UPDATE_STARTED')

      const response = await MemberService.enrichMember(id)

      commit('UPDATE_SUCCESS', response)

      // Update member
      dispatch('doFind', id)

      // Show enrichment success message
      showEnrichmentSuccessMessage({
        memberEnrichmentCount,
        planEnrichmentCountMax,
        plan: currentTenant.plan,
        isBulk: false
      })
    } catch (error) {
      // Show enrichment error message
      showEnrichmentErrorMessage({ isBulk: false })

      Errors.handle(error)

      commit('UPDATE_ERROR')
    }
  },

  async doBulkEnrich({ commit, rootGetters }, ids) {
    try {
      const currentTenant =
        rootGetters['auth/currentTenant']

      const { memberEnrichmentCount } = currentTenant
      const planEnrichmentCountMax = getEnrichmentMax(
        currentTenant.plan
      )

      // Check if it has reached enrichment maximum
      // If so, show dialog to upgrade plan
      checkEnrichmentLimit(
        memberEnrichmentCount,
        planEnrichmentCountMax
      )

      // Show enrichment loading message
      showEnrichmentLoadingMessage()

      const response = await MemberService.enrichMemberBulk(
        ids
      )

      commit('BULK_UPDATE_MEMBERS_SUCCESS', response)

      // Show enrichment success message
      showEnrichmentSuccessMessage({
        memberEnrichmentCount,
        planEnrichmentCountMax,
        plan: currentTenant.plan,
        isBulk: true
      })
    } catch (error) {
      // Show enrichment error message
      showEnrichmentErrorMessage({ isBulk: true })

      Errors.handle(error)
    }
  }
}
