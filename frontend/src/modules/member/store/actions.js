import { MemberService } from '@/modules/member/member-service'
import memberListExporterFields from '@/modules/member/member-list-exporter-fields'
import Errors from '@/shared/error/errors'
import Exporter from '@/shared/exporter/exporter'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { MemberModel } from '../member-model'
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
      filter: state.filter
    })
  },

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
          crowdInfo: {
            ...row.crowdInfo,
            team: true
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

  doChangePagination(
    { commit, state, dispatch },
    pagination
  ) {
    commit('PAGINATION_CHANGED', pagination)
    const filter = state.filter
    dispatch('doFetch', {
      filter,
      keepPagination: true
    })
  },

  doChangePaginationPageSize(
    { commit, state, dispatch },
    pageSize
  ) {
    commit('PAGINATION_PAGE_SIZE_CHANGED', pageSize)
    const filter = state.filter
    dispatch('doFetch', {
      filter,
      keepPagination: true
    })
  },

  doChangePaginationCurrentPage(
    { commit, state, dispatch },
    currentPage
  ) {
    commit('PAGINATION_CURRENT_PAGE_CHANGED', currentPage)
    const filter = state.filter
    dispatch('doFetch', {
      filter,
      keepPagination: true
    })
  },

  doChangeSort({ commit, state, dispatch }, sorter) {
    commit('SORTER_CHANGED', sorter)
    const filter = state.filter
    dispatch('doFetch', {
      filter,
      keepPagination: true
    })
  },

  doChangeActiveView(
    { commit, state, dispatch },
    activeView
  ) {
    commit('ACTIVE_VIEW_CHANGED', activeView)

    const filter = state.views[activeView].filter
    dispatch('doFetch', {
      filter,
      keepPagination: true
    })
  },

  async doFetch(
    { commit, getters },
    { filter = null, keepPagination = false }
  ) {
    try {
      commit('FETCH_STARTED', {
        filter,
        keepPagination
      })

      const response = await MemberService.list(
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

  async doFind({ commit }, id) {
    try {
      commit('FIND_STARTED')
      const record = await MemberService.find(id)
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

      await MemberService.destroyAll([id])

      commit('DESTROY_SUCCESS')

      Message.success(
        i18n('entities.member.destroy.success')
      )

      router.push('/members')

      dispatch(
        `member/doFetch`,
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

      await MemberService.destroyAll(ids)

      commit('DESTROY_ALL_SUCCESS')

      dispatch(`member/doUnselectAll`, null, {
        root: true
      })

      Message.success(
        i18n('entities.member.destroyAll.success')
      )

      router.push('/members')

      dispatch(
        `member/doFetch`,
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

  async doCreate({ commit, dispatch }, values) {
    try {
      commit('CREATE_STARTED')
      await MemberService.create(values)
      commit('CREATE_SUCCESS')
      Message.success(
        i18n('entities.member.create.success')
      )
      dispatch('member/doFetch', {}, { root: true })
    } catch (error) {
      Errors.handle(error)
      commit('CREATE_ERROR')
    }
  },

  async doUpdate({ commit, dispatch }, { id, values }) {
    try {
      commit('UPDATE_STARTED')

      await MemberService.update(id, values)

      commit('UPDATE_SUCCESS')
      Message.success(
        i18n('entities.member.update.success')
      )
      if (router.currentRoute.name === 'member') {
        dispatch('member/doFetch', {}, { root: true })
      } else {
        dispatch('member/doFind', id, {
          root: true
        })
      }
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_ERROR')
    }
  },

  addFilterAttribute({ commit, dispatch, state }, filter) {
    commit('ADD_FILTER_ATTRIBUTE', filter)

    if (
      Array.isArray(filter.value)
        ? filter.value.length > 0
        : filter.value !== null
    ) {
      dispatch('doFetch', {
        filter: state.filter
      })
    }
  },

  updateFilterAttribute(
    { commit, dispatch, state },
    filter
  ) {
    commit('UPDATE_FILTER_ATTRIBUTE', filter)
    if (
      Array.isArray(filter.value)
        ? filter.value.length > 0
        : filter.value !== null
    ) {
      dispatch('doFetch', {
        filter: state.filter
      })
    }
  },

  destroyFilterAttribute(
    { commit, dispatch, state },
    filter
  ) {
    commit('DESTROY_FILTER_ATTRIBUTE', filter)
    if (
      Array.isArray(filter.value)
        ? filter.value.length > 0
        : filter.value !== null
    ) {
      dispatch('doFetch', {
        filter: state.filter
      })
    }
  },

  updateFilterOperator(
    { commit, dispatch, state },
    operator
  ) {
    commit('UPDATE_FILTER_OPERATOR', operator)
    dispatch('doFetch', {
      filter: state.filter
    })
  }
}
