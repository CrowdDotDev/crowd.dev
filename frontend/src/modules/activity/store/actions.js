import { ActivityService } from '@/modules/activity/activity-service'
import Errors from '@/shared/error/errors'
import { router } from '@/router'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'
import { attributeIsDifferent } from '@/shared/filter/is-different'
import { ConversationService } from '@/modules/conversation/conversation-service'

export default {
  async doReset({ commit, state, dispatch }) {
    commit('RESETED')
    return dispatch('doFetch', {
      filter: state.filter
    })
  },

  async doResetActiveView({
    commit,
    state,
    dispatch,
    getters
  }) {
    const activeView = getters.activeView
    commit('FILTER_CHANGED', activeView.filter)
    commit('SORTER_CHANGED', activeView.sorter)
    return dispatch('doFetch', {
      filter: state.filter,
      keepPagination: false
    })
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
    { commit, dispatch, getters },
    activeView
  ) {
    commit('ACTIVE_VIEW_CHANGED', activeView)
    commit('FILTER_CHANGED', getters['activeView'].filter)
    commit('SORTER_CHANGED', getters['activeView'].sorter)
    router.push({
      name: 'activity',
      query: {
        activeTab:
          activeView === 'activities'
            ? undefined
            : activeView
      }
    })

    return dispatch('doFetch', {
      keepPagination: false
    })
  },

  async doFetch(
    { commit, getters, state },
    { keepPagination = false }
  ) {
    try {
      commit('FETCH_STARTED', { keepPagination })

      let response

      if (getters.activeView.type === 'conversations') {
        response = await ConversationService.query(
          {},
          getters.orderBy,
          getters.limit,
          getters.offset
        )
      } else {
        response = await ActivityService.list(
          state.filter,
          getters.orderBy,
          getters.limit,
          getters.offset
        )
      }

      commit('FETCH_SUCCESS', {
        rows: response.rows,
        count: response.count,
        type: getters.activeView.type
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR')
    }
  },

  async doFind({ commit, getters }, id) {
    try {
      commit('FIND_STARTED')

      let record
      if (getters.activeView.type === 'conversations') {
        record = await ConversationService.find(id)
      } else {
        record = await ActivityService.find(id)
      }
      commit('FIND_SUCCESS', {
        record,
        type: getters.activeView.type
      })
      return record
    } catch (error) {
      Errors.handle(error)
      commit('FIND_ERROR')
      router.push('/activities')
    }
  },

  async doDestroy({ commit, dispatch, getters }, id) {
    try {
      commit('DESTROY_STARTED')

      if (getters.activeView.type === 'conversations') {
        await ConversationService.destroyAll([id])
      } else {
        await ActivityService.destroyAll([id])
      }

      commit('DESTROY_SUCCESS', {
        id,
        type: getters.activeView.type
      })

      Message.success(
        i18n('entities.activity.destroy.success')
      )

      router.push('/activities')

      dispatch('doFetch', {
        keepPagination: true
      })
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_ERROR')
    }
  },

  async doDestroyAll({ commit, dispatch }, ids) {
    try {
      commit('DESTROY_ALL_STARTED')

      await ActivityService.destroyAll(ids)

      commit('DESTROY_ALL_SUCCESS')

      dispatch(`activity/doUnselectAll`, null, {
        root: true
      })

      Message.success(
        i18n('entities.activity.destroyAll.success')
      )

      router.push('/activities')

      dispatch('doFetch', {
        keepPagination: true
      })
    } catch (error) {
      Errors.handle(error)
      commit('DESTROY_ALL_ERROR')
    }
  },

  addFilterAttribute(
    { commit, dispatch, state },
    attribute
  ) {
    commit('FILTER_ATTRIBUTE_ADDED', attribute)

    if (
      attributeIsDifferent(
        attribute,
        state.filter.attributes[attribute.name]
      )
    ) {
      dispatch('doFetch', {
        keepPagination: false
      })
    }
  },

  updateFilterAttribute(
    { commit, dispatch, state },
    attribute
  ) {
    commit('FILTER_ATTRIBUTE_CHANGED', attribute)
    if (
      attributeIsDifferent(
        attribute,
        state.filter.attributes[attribute.name]
      )
    ) {
      dispatch('doFetch', {
        keepPagination: false
      })
    }
  },

  destroyFilterAttribute(
    { commit, dispatch, state },
    attribute
  ) {
    commit('FILTER_ATTRIBUTE_DESTROYED', attribute)
    if (
      attributeIsDifferent(
        attribute,
        state.filter.attributes[attribute.name]
      )
    ) {
      dispatch('doFetch', {
        keepPagination: false
      })
    }
  },

  resetFilterAttribute({ commit, dispatch }, attribute) {
    commit('FILTER_ATTRIBUTE_RESETED', attribute)
    dispatch('doFetch', {
      keepPagination: false
    })
  },

  updateFilterOperator({ commit, dispatch }, operator) {
    commit('FILTER_OPERATOR_CHANGED', operator)
    dispatch('doFetch', {
      keepPagination: false
    })
  }
}
