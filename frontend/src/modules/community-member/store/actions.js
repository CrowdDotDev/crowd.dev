import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import communityMemberListExporterFields from '@/modules/community-member/community-member-list-exporter-fields'
import Errors from '@/shared/error/errors'
import Exporter from '@/shared/exporter/exporter'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { CommunityMemberModel } from '../community-member-model'
import { FormSchema } from '@/shared/form/form-schema'

export default {
  doUnselectAll({ commit }) {
    commit('UNSELECT_ALL')
  },

  doMountTable({ commit }, table) {
    commit('TABLE_MOUNTED', table)
  },

  async doReset({ commit, state, dispatch }) {
    commit('RESETED')
    return dispatch('doFetch', {
      filter: state.filter,
      rawFilter: state.rawFilter
    })
  },

  async doExport({ commit, state, getters }) {
    try {
      if (
        !communityMemberListExporterFields ||
        !communityMemberListExporterFields.length
      ) {
        throw new Error(
          'communityMemberListExporterFields is required'
        )
      }

      commit('EXPORT_STARTED')

      const filter = state.filter

      const response = await CommunityMemberService.list(
        filter,
        getters.orderBy,
        null,
        null
      )

      new Exporter(
        communityMemberListExporterFields,
        'community-member'
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
      const rawFilter = state.rawFilter

      for (const row of selectedRows) {
        await CommunityMemberService.update(row.id, {
          crowdInfo: {
            ...row.crowdInfo,
            team: true
          }
        })
      }

      dispatch('doFetch', {
        filter,
        rawFilter,
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

  doChangePagination(
    { commit, state, dispatch },
    pagination
  ) {
    commit('PAGINATION_CHANGED', pagination)
    const filter = state.filter
    const rawFilter = state.rawFilter
    dispatch('doFetch', {
      filter,
      rawFilter,
      keepPagination: true
    })
  },

  doChangePaginationPageSize(
    { commit, state, dispatch },
    pageSize
  ) {
    commit('PAGINATION_PAGE_SIZE_CHANGED', pageSize)
    const filter = state.filter
    const rawFilter = state.rawFilter
    dispatch('doFetch', {
      filter,
      rawFilter,
      keepPagination: true
    })
  },

  doChangePaginationCurrentPage(
    { commit, state, dispatch },
    currentPage
  ) {
    commit('PAGINATION_CURRENT_PAGE_CHANGED', currentPage)
    const filter = state.filter
    const rawFilter = state.rawFilter
    dispatch('doFetch', {
      filter,
      rawFilter,
      keepPagination: true
    })
  },

  doChangeSort({ commit, state, dispatch }, sorter) {
    commit('SORTER_CHANGED', sorter)
    const filter = state.filter
    const rawFilter = state.rawFilter
    dispatch('doFetch', {
      filter,
      rawFilter,
      keepPagination: true
    })
  },

  async doFetch(
    { commit, getters },
    {
      filter = null,
      rawFilter = null,
      keepPagination = false
    }
  ) {
    try {
      commit('FETCH_STARTED', {
        filter,
        rawFilter,
        keepPagination
      })

      const response = await CommunityMemberService.list(
        filter,
        getters.orderBy,
        getters.limit,
        getters.offset
      )

      commit('FETCH_SUCCESS', {
        rows: response.rows,
        count: response.count
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR')
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

      await CommunityMemberService.merge(
        memberToKeep,
        memberToMerge
      )

      commit('MERGE_SUCCESS', {
        memberToDelete: memberToMerge.id
      })

      Message.success(
        i18n('entities.communityMember.merge.success')
      )
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
    const { fields } = CommunityMemberModel
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
      const updatedMembers =
        await CommunityMemberService.updateBulk(payload)
      commit(
        'BULK_UPDATE_MEMBERS_TAGS_SUCCESS',
        updatedMembers
      )
    } catch (error) {
      Errors.handle(error)
      commit('BULK_UPDATE_MEMBERS_TAGS_ERROR')
    }
  },

  async doFind({ commit }, id) {
    try {
      commit('FIND_STARTED')
      const record = await CommunityMemberService.find(id)
      commit('FIND_SUCCESS', record)
    } catch (error) {
      Errors.handle(error)
      commit('FIND_ERROR')
      router.push('/members')
    }
  },

  async doDestroy({ commit, dispatch, state }, id) {
    try {
      commit('DESTROY_STARTED')

      await CommunityMemberService.destroyAll([id])

      commit('DESTROY_SUCCESS')

      Message.success(
        i18n('entities.communityMember.destroy.success')
      )

      router.push('/members')

      dispatch(
        `communityMember/doFetch`,
        {
          filter: state.list.filter
        },
        {
          root: true
        }
      )
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_ERROR')
    }
  },

  async doDestroyAll({ commit, dispatch, state }, ids) {
    try {
      commit('DESTROY_ALL_STARTED')

      await CommunityMemberService.destroyAll(ids)

      commit('DESTROY_ALL_SUCCESS')

      dispatch(`communityMember/doUnselectAll`, null, {
        root: true
      })

      Message.success(
        i18n('entities.communityMember.destroyAll.success')
      )

      router.push('/members')

      dispatch(
        `communityMember/doFetch`,
        {
          filter: state.list.filter
        },
        {
          root: true
        }
      )
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_ALL_ERROR')
    }
  },

  async doCreate({ commit, dispatch, state }, values) {
    try {
      commit('CREATE_STARTED')
      await CommunityMemberService.create(values)
      commit('CREATE_SUCCESS')
      Message.success(
        i18n('entities.communityMember.create.success')
      )
      dispatch(
        'communityMember/doFetch',
        {
          filter: state.list.rawFilter
        },
        { root: true }
      )
    } catch (error) {
      Errors.handle(error)
      commit('CREATE_ERROR')
    }
  },

  async doUpdate(
    { commit, dispatch, state },
    { id, values }
  ) {
    try {
      commit('UPDATE_STARTED')

      await CommunityMemberService.update(id, values)

      commit('UPDATE_SUCCESS')
      Message.success(
        i18n('entities.communityMember.update.success')
      )
      if (router.currentRoute.name === 'communityMember') {
        dispatch(
          'communityMember/doFetch',
          {
            filter: state.list.rawFilter
          },
          { root: true }
        )
      } else {
        dispatch('communityMember/doFind', id, {
          root: true
        })
      }
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_ERROR')
    }
  }
}
