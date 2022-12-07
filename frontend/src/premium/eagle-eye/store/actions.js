import sharedActions from '@/shared/store/actions'
import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'

export default {
  ...sharedActions('eagleEye'),
  async doFetch(
    { commit, getters },
    { keepPagination = false }
  ) {
    try {
      commit('FETCH_STARTED', {
        keepPagination
      })

      const response = await EagleEyeService.list(
        getters.activeView.filter,
        getters.orderBy,
        getters.limit,
        getters.offset
      )

      if (
        getters.activeView.filter.attributes.keywords &&
        getters.activeView.filter.attributes.keywords.value
          ?.length > 0
      ) {
        localStorage.setItem(
          'eagleEye_keywords',
          getters.activeView.filter.attributes.keywords
            .value
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

  async doPopulate(
    { commit, getters },
    { keepPagination = false }
  ) {
    try {
      commit('POPULATE_STARTED', {
        keepPagination
      })
      const keywords =
        getters.activeView.filter.attributes.keywords.value

      await EagleEyeService.populate(keywords)

      commit('POPULATE_SUCCESS', {
        keywords
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
