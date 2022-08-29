import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'
import Vue from 'vue'

const INITIAL_PAGE_SIZE = 20

const urlSearchParams = new URLSearchParams(
  window.location.search
)
const params = Object.fromEntries(urlSearchParams.entries())

export default {
  namespaced: true,

  state: {
    records: {},
    rows: [],
    count: 0,
    loading: false,
    filter: {
      nDays: 1
    },
    rawFilter: {
      nDays: 1
    },
    pagination: {},
    sorter: {
      prop: 'similarityScore',
      order: 'descending'
    },
    activeTab: params['activeTab'] || 'inbox'
  },

  getters: {
    loading: (state) => state.loading,

    find: (state) => (id) => {
      return state.records[id]
    },

    records: (state) => {
      return state.records
    },

    rows: (state) => {
      return state.rows.map((id) => state.records[id])
    },

    activeTabRows: (state, getters) => {
      return getters.rows.filter((r) => {
        return state.activeTab === 'inbox'
          ? r.status === null
          : r.status === state.activeTab
      })
    },

    activeTab: (state) => {
      return state.activeTab
    },

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

    sorter: (state) => state.sorter,

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
    }
  },

  mutations: {
    RESETED(state) {
      state.rows = []
      state.count = 0
      state.loading = false
      state.filter = {
        keywords: state.filter.keywords,
        nDays: 1
      }
      state.rawFilter = {
        keywords: state.filter.keywords,
        nDays: 1
      }
      state.pagination = {}
      state.sorter = {
        prop: 'similarityScore',
        order: 'descending'
      }
      if (state.table) {
        state.table.clearSelection()
      }
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
      for (let record of payload.rows) {
        if (state.records[record.id]) {
          Vue.set(state.records, record.id, {
            ...record
          })
        } else {
          Vue.set(state.records, record.id, record)
        }
      }
      state.rows = payload.rows.map((row) => row.id)
      state.count = payload.count
    },

    FETCH_ERROR(state) {
      state.loading = false
      state.rows = []
      state.count = 0
    },

    POPULATE_STARTED(state) {
      state.loading = true
    },

    POPULATE_SUCCESS(state) {
      state.loading = true
    },

    POPULATE_ERROR(state) {
      state.loading = false
    },

    ENGAGE_STARTED() {},

    ENGAGE_SUCCESS(state, recordId) {
      if (state.records[recordId].status !== 'engaged') {
        state.count--
      }
      Vue.set(state.records[recordId], 'status', 'engaged')
    },
    ENGAGE_ERROR() {},

    EXCLUDE_STARTED() {},

    EXCLUDE_SUCCESS(state, recordId) {
      Vue.set(state.records[recordId], 'status', 'rejected')
      state.count--
    },
    EXCLUDE_ERROR() {},

    REVERT_EXCLUDE_STARTED() {},

    REVERT_EXCLUDE_SUCCESS(state, recordId) {
      Vue.set(state.records[recordId], 'status', null)
      state.count--
    },
    REVERT_EXCLUDE_ERROR() {},

    ACTIVE_TAB_CHANGED(state, activeTab) {
      state.activeTab = activeTab
    }
  },

  actions: {
    async doResetStore({ commit }) {
      commit('RESETED')
    },
    async doReset({ commit, getters, dispatch }) {
      commit('RESETED')
      return dispatch('doFetch', {
        filter: getters.filter,
        rawFilter: getters.rawFilter
      })
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

    doChangeActiveTab({ commit, dispatch }, activeTab) {
      commit('ACTIVE_TAB_CHANGED', activeTab)
      commit('RESETED')
      const filtersToApply = {
        status:
          activeTab === 'inbox' ? undefined : activeTab
      }
      dispatch('doFetch', {
        filter: filtersToApply,
        rawFilter: filtersToApply,
        keepPagination: true
      })
    },

    async doFetch(
      { commit, getters, dispatch },
      {
        filter = null,
        rawFilter = null,
        keepPagination = false
      }
    ) {
      try {
        if (filter.keywords && filter.keywords.length > 0) {
          await dispatch('doPopulate', {
            keywords: filter.keywords.split(','),
            nDays: filter.nDays
          })
        }
        commit('FETCH_STARTED', {
          filter,
          rawFilter,
          keepPagination
        })

        const response = await EagleEyeService.list(
          {
            ...filter,
            keywords:
              filter.keywords && filter.keywords.length > 0
                ? filter.keywords
                : undefined,
            status:
              getters.activeTab === 'inbox'
                ? undefined
                : getters.activeTab,
            platforms: filter.platforms
              ? filter.platforms.join(',')
              : undefined
          },
          getters.orderBy,
          getters.limit,
          getters.offset
        )

        if (filter.keywords) {
          localStorage.setItem(
            'eagleEye_keywords',
            filter.keywords
          )
        }

        commit('FETCH_SUCCESS', {
          rows: response.rows,
          count: response.count
        })
      } catch (error) {
        Errors.handle(error)
        commit('FETCH_ERROR')
      }
    },

    async doPopulate({ commit }, { keywords, nDays }) {
      try {
        commit('POPULATE_STARTED', {
          keywords,
          nDays
        })

        await EagleEyeService.populate(keywords, nDays)

        commit('POPULATE_SUCCESS', {
          keywords,
          nDays
        })
      } catch (error) {
        Errors.handle(error)
        commit('POPULATE_ERROR')
      }
    },

    async doExclude({ commit }, recordId) {
      try {
        commit('EXCLUDE_STARTED', recordId)

        await EagleEyeService.exclude(recordId)

        commit('EXCLUDE_SUCCESS', recordId)
      } catch (error) {
        Errors.handle(error)
        commit('EXCLUDE_ERROR')
      }
    },

    async doRevertExclude({ commit }, recordId) {
      try {
        commit('REVERT_EXCLUDE_STARTED', recordId)

        await EagleEyeService.revertExclude(recordId)

        commit('REVERT_EXCLUDE_SUCCESS', recordId)
      } catch (error) {
        Errors.handle(error)
        commit('REVERT_EXCLUDE_ERROR')
      }
    },

    async doEngage({ commit }, recordId) {
      try {
        commit('ENGAGE_STARTED', recordId)

        await EagleEyeService.engage(recordId)

        commit('ENGAGE_SUCCESS', recordId)
      } catch (error) {
        Errors.handle(error)
        commit('ENGAGE_ERROR')
      }
    }
  }
}
