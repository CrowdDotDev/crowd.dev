import { attributesAreDifferent } from '@/shared/filter/helpers/different-util'
import { router } from '@/router'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default (moduleService = null) => {
  const asyncActions = moduleService
    ? {
        async doFetch(
          { commit, getters, state },
          { keepPagination = false }
        ) {
          try {
            commit('FETCH_STARTED', { keepPagination })

            const response = await moduleService.list(
              state.filter,
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

        async doFind({ commit }, id) {
          try {
            commit('FIND_STARTED')
            const record = await moduleService.find(id)
            commit('FIND_SUCCESS', record)
            return record
          } catch (error) {
            Errors.handle(error)
            commit('FIND_ERROR')
            router.push('/members')
          }
        },

        async doDestroy({ commit, dispatch }, id) {
          try {
            commit('DESTROY_STARTED')

            await moduleService.destroyAll([id])

            commit('DESTROY_SUCCESS')

            Message.success(
              i18n('entities.member.destroy.success')
            )

            router.push('/members')

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

            await moduleService.destroyAll(ids)

            commit('DESTROY_ALL_SUCCESS')

            dispatch(`member/doUnselectAll`, null, {
              root: true
            })

            Message.success(
              i18n('entities.member.destroyAll.success')
            )

            router.push('/members')

            dispatch('doFetch', {
              keepPagination: true
            })
          } catch (error) {
            Errors.handle(error)
            commit('DESTROY_ALL_ERROR')
          }
        },

        async doCreate({ commit }, values) {
          try {
            commit('CREATE_STARTED')
            const response = await moduleService.create(
              values
            )
            commit('CREATE_SUCCESS', response)

            Message.success(
              i18n('entities.member.create.success')
            )

            return response
          } catch (error) {
            Message.error(
              i18n('entities.member.create.error')
            )

            Errors.handle(error)
            commit('CREATE_ERROR')

            return false
          }
        },

        async doUpdate({ commit }, { id, values }) {
          try {
            commit('UPDATE_STARTED')

            const response = await moduleService.update(
              id,
              values
            )

            commit('UPDATE_SUCCESS', response)
            Message.success(
              i18n('entities.member.update.success')
            )

            return response
          } catch (error) {
            Message.error(
              i18n('entities.member.update.error')
            )

            Errors.handle(error)
            commit('UPDATE_ERROR')

            return false
          }
        }
      }
    : {}

  return {
    ...asyncActions,
    doUnselectAll({ commit }) {
      commit('UNSELECT_ALL')
    },

    doMountTable({ commit }, table) {
      commit('TABLE_MOUNTED', table)
    },

    doReset({ commit, state, dispatch }) {
      commit('RESETED')
      return dispatch('doFetch', {
        filter: state.filter
      })
    },

    doResetActiveView({
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
      { commit, dispatch, getters, state },
      activeView
    ) {
      commit('ACTIVE_VIEW_CHANGED', activeView)
      commit('FILTER_CHANGED', getters.activeView.filter)
      commit('SORTER_CHANGED', getters.activeView.sorter)

      const params = new URLSearchParams(
        window.location.search
      )
      if (params.get('activeTab') !== activeView) {
        router.push({
          name: router.currentRoute.name,
          query: {
            activeTab:
              activeView === state.views[0].id
                ? undefined
                : activeView
          }
        })
      }

      return dispatch('doFetch', {
        keepPagination: false
      })
    },

    addFilterAttribute({ commit, dispatch }, attribute) {
      let shouldFetch = Array.isArray(attribute.value)
        ? attribute.value.length > 0
        : attribute.value !== null

      commit('FILTER_ATTRIBUTE_ADDED', attribute)

      if (shouldFetch) {
        dispatch('doFetch', {
          keepPagination: false
        })
      }
    },

    updateFilterAttribute(
      { commit, dispatch, state },
      attribute
    ) {
      let shouldFetch = attributesAreDifferent(
        state.filter.attributes[attribute.name],
        attribute
      )

      commit('FILTER_ATTRIBUTE_CHANGED', attribute)

      if (shouldFetch) {
        dispatch('doFetch', {
          keepPagination: false
        })
      }
    },

    destroyFilterAttribute(
      { commit, dispatch },
      attribute
    ) {
      let shouldFetch = Array.isArray(attribute.value)
        ? attribute.value.length > 0
        : attribute.value !== null

      commit('FILTER_ATTRIBUTE_DESTROYED', attribute)

      if (shouldFetch) {
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
      commit('FILTER_OPERATOR_UPDATED', operator)
      dispatch('doFetch', {
        keepPagination: false
      })
    }
  }
}
