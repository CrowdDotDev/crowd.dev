import sharedActions from '@/shared/store/actions'
import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'

export default {
  ...sharedActions(),
  async doFetch(
    { commit, getters, state, dispatch },
    { keepPagination = false }
  ) {
    try {
      if (
        state.filter.attributes.keywords &&
        state.filter.attributes.keywords.value &&
        state.filter.attributes.keywords.value.length > 0
      ) {
        await dispatch('doPopulate', {
          keywords: state.filter.attributes.keywords.value,
          nDays: state.filter.attributes.nDays?.value
        })
      }
      commit('FETCH_STARTED', {
        keepPagination
      })

      const response = await EagleEyeService.list(
        state.filter,
        getters.orderBy,
        getters.limit,
        getters.offset
      )

      if (
        state.filter.attributes.keywords &&
        state.filter.attributes.keywords.value?.length > 0
      ) {
        localStorage.setItem(
          'eagleEye_keywords',
          state.filter.attributes.keywords.value
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
