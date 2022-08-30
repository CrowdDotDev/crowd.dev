import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import communityMemberListExporterFields from '@/modules/community-member/community-member-list-exporter-fields'
import Errors from '@/shared/error/errors'
import Exporter from '@/shared/exporter/exporter'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { CommunityMemberModel } from './community-member-model'
import { FormSchema } from '@/shared/form/form-schema'

const INITIAL_PAGE_SIZE = 20

export default {
  namespaced: true,

  state: () => {
    return {
      rows: [],
      count: 0,
      loading: false,
      filter: {},
      rawFilter: {},
      pagination: {},
      sorter: {
        prop: 'score',
        order: 'descending'
      },
      table: null,
      mergeLoading: false
    }
  },

  getters: {
    loading: (state) => state.loading,

    exportLoading: (state) => state.exportLoading,

    mergeLoading: (state) => state.mergeLoading,

    rows: (state) => state.rows || [],

    count: (state) => state.count,

    hasRows: (state, getters) => getters.count > 0,

    orderBy: (state) => {
      const sorter = state.sorter

      if (!sorter) {
        return null
      }

      if (!sorter.prop) {
        return null
      }

      let direction =
        sorter.order === 'descending' ? 'DESC' : 'ASC'

      return `${sorter.prop}_${direction}`
    },

    filter: (state) => state.filter,

    rawFilter: (state) => state.rawFilter,

    limit: (state) => {
      const pagination = state.pagination

      if (!pagination || !pagination.pageSize) {
        return INITIAL_PAGE_SIZE
      }

      return pagination.pageSize
    },

    offset: (state) => {
      const pagination = state.pagination

      if (!pagination || !pagination.pageSize) {
        return 0
      }

      const currentPage = pagination.currentPage || 1

      return (currentPage - 1) * pagination.pageSize
    },

    pagination: (state, getters) => {
      return {
        ...state.pagination,
        total: getters.count,
        showSizeChanger: true
      }
    },

    selectedRows: (state) => {
      return state.table
        ? state.table.getSelectionRows()
        : []
    }
  },

  mutations: {
    RESETED(state) {
      state.rows = []
      state.count = 0
      state.loading = false
      state.filter = { type: state.filter.type }
      state.rawFilter = { type: state.rawFilter.type }
      state.pagination = {}
      state.sorter = {
        prop: 'score',
        order: 'descending'
      }
      if (state.table) {
        state.table.clearSelection()
      }
    },

    UNSELECT_ALL(state) {
      if (state.table) {
        state.table.clearSelection()
      }
    },

    TABLE_MOUNTED(state, payload) {
      state.table = payload
    },

    PAGINATION_CHANGED(state, payload) {
      state.pagination = payload || {}
    },

    PAGINATION_CURRENT_PAGE_CHANGED(state, payload) {
      const previousPagination = state.pagination || {}

      state.pagination = {
        currentPage: payload || 1,
        pageSize:
          previousPagination.pageSize || INITIAL_PAGE_SIZE
      }
    },

    PAGINATION_PAGE_SIZE_CHANGED(state, payload) {
      const previousPagination = state.pagination || {}

      state.pagination = {
        currentPage: previousPagination.currentPage || 1,
        pageSize: payload || INITIAL_PAGE_SIZE
      }
    },

    SORTER_CHANGED(state, payload) {
      state.sorter = payload || {}
    },

    FETCH_STARTED(state, payload) {
      state.loading = true

      if (state.table) {
        state.table.clearSelection()
      }

      state.rawFilter =
        payload && state.rawFilter ? state.rawFilter : {}
      state.filter =
        payload && payload.filter ? payload.filter : {}
      state.pagination =
        payload && payload.keepPagination
          ? state.pagination
          : {
              pageSize:
                state.pagination &&
                state.pagination.pageSize
            }
    },

    FETCH_SUCCESS(state, payload) {
      state.loading = false
      state.rows = payload.rows
      state.count = payload.count
    },

    FETCH_ERROR(state) {
      state.loading = false
      state.rows = []
      state.count = 0
    },

    FIND_LOOKALIKE_STARTED(state) {
      state.loading = true
    },
    FIND_LOOKALIKE_SUCCESS() {},
    FIND_LOOKALIKE_ERROR() {},

    EXPORT_STARTED(state) {
      state.exportLoading = true
    },

    EXPORT_SUCCESS(state) {
      state.exportLoading = false
    },

    EXPORT_ERROR(state) {
      state.exportLoading = false
    },

    MERGE_STARTED(state) {
      state.mergeLoading = true
    },

    MERGE_SUCCESS(state) {
      state.mergeLoading = false
    },

    MERGE_ERROR(state) {
      state.mergeLoading = false
    },

    BULK_UPDATE_MEMBERS_TAGS_STARTED(state) {
      state.loading = true
    },

    BULK_UPDATE_MEMBERS_TAGS_SUCCESS(state, members) {
      for (const member of members) {
        const index = state.rows.findIndex(
          (r) => r.id === member.id
        )
        state.rows[index] = member
      }
      state.loading = false
    },

    BULK_UPDATE_MEMBERS_TAGS_ERROR(state) {
      state.loading = false
    }
  },

  actions: {
    doUnselectAll({ commit }) {
      commit('UNSELECT_ALL')
    },

    doMountTable({ commit }, table) {
      commit('TABLE_MOUNTED', table)
    },

    async doReset({ commit, getters, dispatch }) {
      commit('RESETED')
      return dispatch('doFetch', {
        filter: getters.filter,
        rawFilter: getters.rawFilter
      })
    },

    async doExport({ commit, getters }) {
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

        const filter = getters.filter

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

    async doMarkAsTeamMember({ dispatch, getters }) {
      try {
        const selectedRows = getters.selectedRows
        const filter = getters.filter
        const rawFilter = getters.rawFilter

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
      { commit, getters, dispatch },
      pagination
    ) {
      commit('PAGINATION_CHANGED', pagination)
      const filter = getters.filter
      const rawFilter = getters.rawFilter
      dispatch('doFetch', {
        filter,
        rawFilter,
        keepPagination: true
      })
    },

    doChangePaginationPageSize(
      { commit, getters, dispatch },
      pageSize
    ) {
      commit('PAGINATION_PAGE_SIZE_CHANGED', pageSize)
      const filter = getters.filter
      const rawFilter = getters.rawFilter
      dispatch('doFetch', {
        filter,
        rawFilter,
        keepPagination: true
      })
    },

    doChangePaginationCurrentPage(
      { commit, getters, dispatch },
      currentPage
    ) {
      commit('PAGINATION_CURRENT_PAGE_CHANGED', currentPage)
      const filter = getters.filter
      const rawFilter = getters.rawFilter
      dispatch('doFetch', {
        filter,
        rawFilter,
        keepPagination: true
      })
    },

    doChangeSort({ commit, getters, dispatch }, sorter) {
      commit('SORTER_CHANGED', sorter)
      const filter = getters.filter
      const rawFilter = getters.rawFilter
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

        filter.type =
          router.currentRoute.name ===
          'communityMemberLookalike'
            ? 'lookalike'
            : 'member'

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

          memberToUpdate.tags = [
            ...tagsToKeep,
            ...tagsToSave
          ]
          acc.push(
            formSchema.cast({
              id: memberToUpdate.id,
              tags: memberToUpdate.tags
            })
          )
          return acc
        }, [])
        const updatedMembers = await CommunityMemberService.updateBulk(
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
}
