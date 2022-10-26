import _ from 'lodash'
import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    RESETED(state) {
      state.list.ids = []
      state.list.loading = false
      state.count = 0
      state.filter = {}
      state.pagination = {}
      state.sorter = {
        prop: 'score',
        order: 'desc'
      }

      if (state.list.table) {
        state.list.table.clearSelection()
      }
    },

    UNSELECT_ALL(state) {
      if (state.list.table) {
        state.list.table.clearSelection()
      }
    },

    TABLE_MOUNTED(state, payload) {
      state.list.table = payload
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
      state.sorter =
        Object.keys(payload).length > 0
          ? payload
          : {
              prop: 'createdAt',
              order: 'desc'
            }
    },

    ACTIVE_VIEW_CHANGED(state, viewId) {
      state.views = Object.values(state.views).reduce(
        (acc, item) => {
          acc.push({
            ...item,
            active: item.id === viewId
          })
          return acc
        },
        []
      )
    },

    FETCH_STARTED(state, payload) {
      state.list.loading = true

      if (state.table) {
        state.list.table.clearSelection()
      }

      if (!payload.keepPagination) {
        state.list.ids.length = 0
      }

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
      state.list.loading = false
      for (const record of payload.rows) {
        state.records[record.id] = record
      }
      state.list.ids = payload.rows.map((r) => r.id)
      state.count = payload.count
    },

    FETCH_ERROR(state) {
      state.list.loading = false
      state.list.ids = []
      state.count = 0
    },

    CREATE_STARTED() {},
    CREATE_SUCCESS(state, record) {
      state.records[record.id] = record
    },
    CREATE_ERROR() {},

    CREATE_ATTRIBUTES_STARTED() {},
    CREATE_ATTRIBUTES_SUCCESS() {},
    CREATE_ATTRIBUTES_ERROR() {},

    UPDATE_STARTED() {},
    UPDATE_SUCCESS(state, record) {
      state.records[record.id] = record
    },
    UPDATE_ERROR() {},

    DESTROY_ALL_STARTED() {},
    DESTROY_ALL_SUCCESS() {},
    DESTROY_ALL_ERROR() {},

    DESTROY_STARTED() {},
    DESTROY_SUCCESS() {},
    DESTROY_ERROR() {},

    FIND_STARTED() {},
    FIND_SUCCESS(state, payload) {
      state.records[payload.id] = payload
    },
    FIND_ERROR() {},

    FILTER_CHANGED(state, filter) {
      const { attributes, operator } = filter
      state.filter = {
        attributes: _.cloneDeep(attributes) || {},
        operator: operator || 'and'
      }
    },

    FILTER_ATTRIBUTE_ADDED(state, attribute) {
      state.filter.attributes[attribute.name] = attribute
    },

    FILTER_ATTRIBUTE_CHANGED(state, attribute) {
      state.filter.attributes[attribute.name] = attribute
    },

    FILTER_ATTRIBUTE_DESTROYED(state, attribute) {
      delete state.filter.attributes[attribute.name]
      if (
        Object.keys(state.filter.attributes).length === 0
      ) {
        state.filter.operator = 'and'
      }
    },

    FILTER_OPERATOR_UPDATED(state, operator) {
      state.filter.operator = operator
    },

    FILTER_ATTRIBUTE_RESETED(state, attribute) {
      state.filter.attributes[attribute.name].value =
        state.filter.attributes[attribute.name].defaultValue
      state.filter.attributes[attribute.name].operator =
        state.filter.attributes[
          attribute.name
        ].defaultOperator
    }
  }
}
