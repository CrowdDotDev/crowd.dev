import { MemberService } from '@/modules/member/member-service'
import memberListExporterFields from '@/modules/member/member-list-exporter-fields'
import Errors from '@/shared/error/errors'
import Exporter from '@/shared/exporter/exporter'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { MemberModel } from '../member-model'
import { FormSchema } from '@/shared/form/form-schema'
import sharedActions from '@/shared/store/actions'

export default {
  ...sharedActions(MemberService),

  async doExport({ commit, state, getters }) {
    try {
      if (
        !memberListExporterFields ||
        !memberListExporterFields.length
      ) {
        throw new Error(
          'memberListExporterFields is required'
        )
      }

      commit('EXPORT_STARTED')

      const filter = state.filter

      const response = await MemberService.list(
        filter,
        getters.orderBy,
        null,
        null
      )

      new Exporter(
        memberListExporterFields,
        'member'
      ).transformAndExportAsExcelFile(response.rows)

      commit('EXPORT_SUCCESS')
    } catch (error) {
      Errors.handle(error)

      commit('EXPORT_ERROR')
    }
  },

  async doMarkAsTeamMember({ dispatch, state, getters }) {
    try {
      const selectedRows = getters.selectedRows
      const filter = state.filter

      for (const row of selectedRows) {
        await MemberService.update(row.id, {
          attributes: {
            ...row.attributes,
            isTeamMember: {
              crowd: true,
              default: true,
            }
          }
        })
      }

      dispatch('doFetch', {
        filter,
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
