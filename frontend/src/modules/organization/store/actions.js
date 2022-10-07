import { OrganizationService } from '@/modules/organization/organization-service'
import Errors from '@/shared/error/errors'
import Message from '@/shared/message/message'
import { i18n } from '@/i18n'

export default {
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

      const response = await OrganizationService.list(
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

  async doFind({ commit }, id) {
    try {
      commit('FIND_STARTED')
      const record = await OrganizationService.find(id)
      commit('FIND_SUCCESS', record)
    } catch (error) {
      Errors.handle(error)
      commit('FIND_ERROR')
    }
  },

  async doDestroy({ commit, dispatch, state }, id) {
    try {
      commit('DESTROY_STARTED')

      await OrganizationService.destroyAll([id])

      commit('DESTROY_SUCCESS')

      Message.success(
        i18n('entities.organization.destroy.success')
      )

      dispatch(
        `organization/doFetch`,
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

      await OrganizationService.destroyAll(ids)

      commit('DESTROY_ALL_SUCCESS')

      dispatch(`organization/doUnselectAll`, null, {
        root: true
      })

      Message.success(
        i18n('entities.organization.destroyAll.success')
      )

      dispatch(
        `organization/doFetch`,
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
      await OrganizationService.create(values)
      commit('CREATE_SUCCESS')
      Message.success(
        i18n('entities.organization.create.success')
      )
      dispatch(
        'organization/doFetch',
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

      await OrganizationService.update(id, values)

      commit('UPDATE_SUCCESS')
      Message.success(
        i18n('entities.organization.update.success')
      )
      dispatch(
        'organization/doFetch',
        {
          filter: state.list.rawFilter
        },
        { root: true }
      )
    } catch (error) {
      Errors.handle(error)
      commit('UPDATE_ERROR')
    }
  }
}
