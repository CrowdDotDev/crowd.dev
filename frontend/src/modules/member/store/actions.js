import { MemberService } from '@/modules/member/member-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { MemberModel } from '../member-model'
import { FormSchema } from '@/shared/form/form-schema'
import sharedActions from '@/shared/store/actions'
import InformationDialog from '@/shared/dialog/information-dialog'

export default {
  ...sharedActions('member', MemberService),

  async doExport({ commit, getters }, selected = false) {
    let filter
    if (selected) {
      filter = {
        and: [
          {
            memberIds: [
              getters.selectedRows.map((i) => i.id)
            ]
          }
        ]
      }
    } else {
      filter = getters.activeView.filter
    }

    try {
      commit('EXPORT_STARTED', filter)

      const activeView = getters.activeView

      await MemberService.export(
        activeView.filter,
        getters.orderBy,
        null,
        null,
        !selected // build API payload if selected === false
      )
      commit('EXPORT_SUCCESS')

      await InformationDialog({
        title: 'Export CSV',
        message:
          'The CSV file was sent to your e-mail in order for you to download it',
        icon: 'ri-file-download-line',
        confirmButtonText: 'Continue'
      })
    } catch (error) {
      Errors.handle(error)

      commit('EXPORT_ERROR')

      if (error.response.status === 403) {
        await InformationDialog({
          type: 'danger',
          title:
            'You have reached the limit of 2 CSV exports per month on your current plan',
          message:
            'Upgrade your plan to get unlimited CSV exports per month and take full advantage of this feature',
          confirmButtonText: 'Upgrade plan'
        })
        router.push('settings?activeTab=plans')
      } else {
        Message.error(
          'There was an error exporting members'
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
  }
}
