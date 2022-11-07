import { attributesAreDifferent } from '@/shared/filter/helpers/different-util'
import { router } from '@/router'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default (moduleName, moduleService = null) => {
  const asyncActions = moduleService
    ? {
        async doFetch(
          { commit, getters },
          { keepPagination = false }
        ) {
          try {
            const activeView = getters.activeView
            commit('FETCH_STARTED', { keepPagination })

            const response = await moduleService.list(
              activeView.filter,
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
            router.push({ name: moduleName })
          }
        },

        async doDestroy({ commit, dispatch }, id) {
          try {
            commit('DESTROY_STARTED')

            await moduleService.destroyAll([id])

            commit('DESTROY_SUCCESS')

            Message.success(
              i18n(`entities.${moduleName}.destroy.success`)
            )

            router.push({ name: moduleName })

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

            dispatch(`${moduleName}/doUnselectAll`, null, {
              root: true
            })

            Message.success(
              i18n(
                `entities.${moduleName}.destroyAll.success`
              )
            )

            router.push({ name: moduleName })

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
              i18n(`entities.${moduleName}.create.success`)
            )

            return response
          } catch (error) {
            Message.error(
              i18n(`entities.${moduleName}.create.error`)
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
              i18n(`entities.${moduleName}.update.success`)
            )

            return response
          } catch (error) {
            Message.error(
              i18n(`entities.${moduleName}.update.error`)
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

    doReset({ commit, dispatch }) {
      commit('RESETED')
      return dispatch('doFetch', {})
    },

    /**
     *  View-based actions
     */
    doResetActiveView({ commit, dispatch, getters }) {
      const activeView = getters.activeView
      commit('FILTER_CHANGED', {
        activeView,
        filter: activeView.initialFilter
      })
      commit('SORTER_CHANGED', {
        activeView,
        sorter: activeView.initialSorter
      })
      return dispatch('doFetch', {
        keepPagination: false
      })
    },

    doChangePagination(
      { commit, dispatch, getters },
      pagination
    ) {
      const activeView = getters.activeView
      commit('PAGINATION_CHANGED', {
        activeView,
        pagination
      })
      dispatch('doFetch', {
        keepPagination: true
      })
    },

    doChangePaginationPageSize(
      { commit, dispatch, getters },
      pageSize
    ) {
      const activeView = getters.activeView
      commit('PAGINATION_PAGE_SIZE_CHANGED', {
        activeView,
        pageSize
      })
      dispatch('doFetch', {
        keepPagination: true
      })
    },

    doChangePaginationCurrentPage(
      { commit, dispatch, getters },
      currentPage
    ) {
      const activeView = getters.activeView
      commit('PAGINATION_CURRENT_PAGE_CHANGED', {
        activeView,
        currentPage
      })
      dispatch('doFetch', {
        keepPagination: true
      })
    },

    doChangeSort({ commit, dispatch, getters }, sorter) {
      const activeView = getters.activeView
      commit('SORTER_CHANGED', { activeView, sorter })
      dispatch('doFetch', {
        keepPagination: true
      })
    },

    doChangeActiveView(
      { commit, dispatch, getters, state },
      activeViewId
    ) {
      commit('ACTIVE_VIEW_CHANGED', activeViewId)

      const params = new URLSearchParams(
        window.location.search
      )
      if (params.get('activeTab') !== activeViewId) {
        router.push({
          name: moduleName,
          query: {
            activeTab:
              activeViewId ===
              Object.values(state.views)[0].id
                ? undefined
                : activeViewId
          }
        })
      }

      const translatedModuleName = i18n(
        `entities.${moduleName}.menu`
      )
      window.analytics.track(
        `${translatedModuleName} View Changed`,
        Object.assign(
          {},
          {
            view: getters.activeView.label
          }
        )
      )

      return dispatch('doFetch', {
        keepPagination: false
      })
    },

    addFilterAttribute(
      { commit, dispatch, getters },
      attribute
    ) {
      const activeView = getters.activeView
      let shouldFetch = Array.isArray(attribute.value)
        ? attribute.value.length > 0
        : attribute.value !== null

      commit('FILTER_ATTRIBUTE_ADDED', {
        activeView,
        attribute
      })

      if (shouldFetch) {
        dispatch('doFetch', {
          keepPagination: false
        })
      }

      const translatedModuleName = i18n(
        `entities.${moduleName}.menu`
      )
      window.analytics.track(
        `${translatedModuleName} Filter Added`,
        Object.assign(
          {},
          {
            view: getters.activeView.label,
            filter: {
              name: attribute.name,
              value: attribute.value,
              operator: attribute.operator
            }
          }
        )
      )
    },

    updateFilterAttribute(
      { commit, dispatch, state, getters },
      attribute
    ) {
      const activeView = getters.activeView
      let shouldFetch = attributesAreDifferent(
        state.views[activeView.id].filter.attributes[
          attribute.name
        ],
        attribute
      )

      commit('FILTER_ATTRIBUTE_CHANGED', {
        activeView,
        attribute
      })

      if (shouldFetch) {
        dispatch('doFetch', {
          keepPagination: false
        })
      }

      const translatedModuleName = i18n(
        `entities.${moduleName}.menu`
      )
      window.analytics.track(
        `${translatedModuleName} Filter Updated`,
        Object.assign(
          {},
          {
            view: getters.activeView.label,
            filter: {
              name: attribute.name,
              value: attribute.value,
              operator: attribute.operator
            }
          }
        )
      )
    },

    destroyFilterAttribute(
      { commit, dispatch, getters },
      attribute
    ) {
      const activeView = getters.activeView
      let shouldFetch = Array.isArray(attribute.value)
        ? attribute.value.length > 0
        : attribute.value !== null

      commit('FILTER_ATTRIBUTE_DESTROYED', {
        activeView,
        attribute
      })

      if (shouldFetch) {
        dispatch('doFetch', {
          keepPagination: false
        })
      }
    },

    resetFilterAttribute(
      { commit, dispatch, getters },
      attribute
    ) {
      const activeView = getters.activeView
      commit('FILTER_ATTRIBUTE_RESETED', {
        activeView,
        attribute
      })
      dispatch('doFetch', {
        keepPagination: false
      })
    },

    updateFilterOperator(
      { commit, dispatch, getters },
      operator
    ) {
      const activeView = getters.activeView
      commit('FILTER_OPERATOR_UPDATED', {
        activeView,
        operator
      })
      dispatch('doFetch', {
        keepPagination: false
      })
    }
  }
}
