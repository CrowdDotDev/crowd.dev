import _ from 'lodash'
import { INITIAL_PAGE_SIZE } from './constants'

export default () => {
  return {
    RESETED(state) {
      state.list.ids = []
      state.list.loading = false
      state.count = 0

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

    FETCH_STARTED(state, payload) {
      state.list.loading = true

      if (state.table) {
        state.list.table.clearSelection()
      }

      if (!payload.keepPagination) {
        state.list.ids.length = 0
      }

      // Use active view pagination
      if (
        payload?.activeView?.pagination &&
        !payload?.keepPagination
      ) {
        payload.activeView.pagination = {
          currentPage: 1,
          pageSize: payload.activeView.pagination.pageSize
        }
      }

      // Use root state pagination
      if (
        !payload?.activeView &&
        state.pagination &&
        !payload?.keepPagination
      ) {
        state.pagination = {
          currentPage: 1,
          pageSize: state.pagination.pageSize
        }
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

    /**
     *  View-based mutations
     */

    PAGINATION_CHANGED(state, payload) {
      const { activeView, pagination } = payload
      state.views[activeView.id].pagination =
        pagination || {}
    },

    PAGINATION_CURRENT_PAGE_CHANGED(state, payload) {
      const { activeView, currentPage } = payload
      const previousPagination =
        state.views[activeView.id].pagination || {}

      state.views[activeView.id].pagination = {
        currentPage: currentPage || 1,
        pageSize:
          previousPagination.pageSize || INITIAL_PAGE_SIZE
      }
    },

    PAGINATION_PAGE_SIZE_CHANGED(state, payload) {
      const { activeView, pageSize } = payload
      const previousPagination = state.pagination || {}

      state.views[activeView.id].pagination = {
        currentPage: previousPagination.currentPage || 1,
        pageSize: pageSize || INITIAL_PAGE_SIZE
      }
    },

    SORTER_CHANGED(state, payload) {
      const { activeView, sorter } = payload
      state.views[activeView.id].sorter =
        Object.keys(sorter).length > 0
          ? sorter
          : {
              prop: 'createdAt',
              order: 'descending'
            }
    },

    ACTIVE_VIEW_CHANGED(state, viewId) {
      state.views = Object.values(state.views).reduce(
        (acc, item) => {
          acc[item.id] = {
            ...item,
            pagination: {
              ...item.pagination,
              currentPage: 1
            },
            active: item.id === viewId
          }
          return acc
        },
        {}
      )
    },

    FILTER_CHANGED(state, payload) {
      const { activeView, filter } = payload
      const { attributes, operator } = filter
      state.views[activeView.id].filter = {
        attributes: _.cloneDeep(attributes) || {},
        operator: operator || 'and'
      }
    },

    FILTER_ATTRIBUTE_ADDED(state, payload) {
      const { activeView, attribute } = payload
      state.views[activeView.id].filter.attributes[
        attribute.name
      ] = attribute
    },

    FILTER_ATTRIBUTE_CHANGED(state, payload) {
      const { activeView, attribute } = payload
      state.views[activeView.id].filter.attributes[
        attribute.name
      ] = attribute
    },

    FILTER_ATTRIBUTE_DESTROYED(state, payload) {
      const { activeView, attribute } = payload
      delete state.views[activeView.id].filter.attributes[
        attribute.name
      ]
      if (
        Object.keys(
          state.views[activeView.id].filter.attributes
        ).length === 0
      ) {
        state.views[activeView.id].filter.operator = 'and'
      }
    },

    FILTER_OPERATOR_UPDATED(state, payload) {
      const { activeView, operator } = payload
      state.views[activeView.id].filter.operator = operator
    },

    FILTER_ATTRIBUTE_RESETED(state, payload) {
      const { activeView, attribute } = payload
      state.views[activeView.id].filter.attributes[
        attribute.name
      ].value =
        state.views[activeView.id].filter.attributes[
          attribute.name
        ].defaultValue
      state.views[activeView.id].filter.attributes[
        attribute.name
      ].operator =
        state.views[activeView.id].filter.attributes[
          attribute.name
        ].defaultOperator
    }
  }
}
