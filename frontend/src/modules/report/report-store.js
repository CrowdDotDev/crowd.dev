import { ReportService } from '@/modules/report/report-service'
import { routerAsync } from '@/router'
import Errors from '@/shared/error/errors'
import Vue from 'vue'

const INITIAL_PAGE_SIZE = 20

export default {
  namespaced: true,

  state: {
    records: {},
    rows: [],
    count: 0,
    loading: {
      table: false,
      view: false,
      form: false,
      submit: false
    },
    filter: {},
    rawFilter: {},
    pagination: {},
    sorter: {},
    table: null,
    form: null
  },

  getters: {
    loading: (state) => (component) =>
      state.loading[component],

    find: (state) => (id) => {
      return state.records[id]
    },

    records: (state) => {
      return state.records
    },

    rows: (state) => {
      return state.rows.map((id) => state.records[id])
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
      return state.table ? state.table.selection : []
    },

    form: (state) => state.form
  },

  mutations: {
    RESETED(state) {
      state.rows = []
      state.count = 0
      state.loading.table = false
      state.filter = { type: state.filter.type }
      state.rawFilter = { type: state.rawFilter.type }
      state.pagination = {}
      state.sorter = {}
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
      state.loading.table = true

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
      state.loading.table = false
      for (let report of payload.rows) {
        Vue.set(state.records, report.id, report)
        if (state.rows.indexOf(report.id) === -1) {
          state.rows.push(report.id)
        }
      }
      state.count = payload.count
    },

    FETCH_ERROR(state) {
      state.loading.table = false
      state.rows = []
      state.count = 0
    },

    FIND_STARTED(state) {
      state.loading.view = true
    },

    FIND_SUCCESS(state, record) {
      state.loading.view = false
      Vue.set(state.records, record.id, record)
    },

    FIND_ERROR(state) {
      state.loading.view = false
    },

    INIT_FORM_STARTED(state) {
      state.form = null
      state.loading.form = true
    },

    INIT_FORM_SUCCESS(state, payload) {
      state.form = payload
      state.loading.form = false
    },

    INIT_FORM_ERROR(state) {
      state.form = null
      state.loading.form = false
    },

    CREATE_STARTED(state) {
      state.loading.submit = true
    },

    CREATE_SUCCESS(state, record) {
      state.loading.submit = false
      Vue.set(state.records, record.id, record)
      if (state.rows.indexOf(record.id) === -1) {
        state.rows.push(record.id)
      }
      state.count++
    },

    CREATE_ERROR(state) {
      state.loading.submit = false
    },

    UPDATE_STARTED(state) {
      state.loading.submit = true
    },

    UPDATE_SUCCESS(state, record) {
      state.loading.submit = false
      Vue.set(state.records, record.id, record)
    },

    UPDATE_ERROR(state) {
      state.loading.submit = false
    },

    DESTROY_STARTED(state) {
      state.loading.submit = true
    },

    DESTROY_SUCCESS(state, reportId) {
      state.loading.submit = false
      const index = state.rows.indexOf(reportId)
      state.rows.splice(index, 1)
      Vue.delete(state.records, reportId)
    },

    DESTROY_ERROR(state) {
      state.loading.submit = false
    },

    DESTROY_ALL_STARTED(state) {
      state.loading.submit = true
    },

    DESTROY_ALL_SUCCESS(state, reportIds) {
      state.loading.submit = false

      for (const reportId of reportIds) {
        const index = state.rows.indexOf(reportId)
        state.rows.splice(index, 1)
        Vue.delete(state.records, reportId)
      }
    },

    DESTROY_ALL_ERROR(state) {
      state.loading.submit = false
    }
  },

  actions: {
    doUnselectAll({ commit }) {
      commit('UNSELECT_ALL')
    },

    doMountTable({ commit }, table) {
      commit('TABLE_MOUNTED', table)
    },

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

        const response = await ReportService.list(
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
    async doCreate({ commit }, report) {
      try {
        commit('CREATE_STARTED')

        const response = await ReportService.create(report)

        commit('CREATE_SUCCESS', response)
        routerAsync().push('/reports')
      } catch (error) {
        Errors.handle(error)
        commit('FETCH_ERROR')
      }
    },

    async doDestroy(
      { commit, dispatch, rootGetters },
      reportId
    ) {
      try {
        commit('DESTROY_STARTED')

        await ReportService.destroyAll([reportId])

        commit('DESTROY_SUCCESS', reportId)

        routerAsync().push('/reports')

        dispatch(
          `report/doFetch`,
          rootGetters[`report/filter`],
          {
            root: true
          }
        )
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ERROR')
      }
    },

    async doDestroyAll(
      { commit, dispatch, rootGetters },
      reportIds
    ) {
      try {
        commit('DESTROY_ALL_STARTED')

        await ReportService.destroyAll(reportIds)

        commit('DESTROY_ALL_SUCCESS', reportIds)

        routerAsync().push('/reports')

        dispatch(
          `report/doFetch`,
          rootGetters[`report/filter`],
          {
            root: true
          }
        )
      } catch (error) {
        Errors.handle(error)
        commit('DESTROY_ALL_ERROR')
      }
    },

    async doFind({ commit }, id) {
      try {
        commit('FIND_STARTED', id)
        const record = await ReportService.find(id)
        commit('FIND_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('FIND_ERROR', id)
      }
    },

    async doFindPublic({ commit }, { id, tenantId }) {
      try {
        commit('FIND_STARTED', id)
        const record = await ReportService.findPublic(
          id,
          tenantId
        )
        commit('FIND_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('FIND_ERROR', id)
      }
    },

    async doInitForm({ commit }, id) {
      try {
        commit('INIT_FORM_STARTED')

        let record = null

        if (id) {
          record = await ReportService.find(id)
        }

        commit('INIT_FORM_SUCCESS', record)
      } catch (error) {
        Errors.handle(error)
        commit('INIT_FORM_ERROR')
      }
    },

    async doUpdate({ commit }, { id, values }) {
      try {
        commit('UPDATE_STARTED', id)
        const record = await ReportService.update(
          id,
          values
        )
        commit('UPDATE_SUCCESS', record)
        routerAsync().push('/reports')
      } catch (error) {
        Errors.handle(error)
        commit('UPDATE_ERROR', id)
      }
    }
  }
}
