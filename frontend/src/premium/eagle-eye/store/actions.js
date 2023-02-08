import sharedActions from '@/shared/store/actions'
import { EagleEyeService } from '@/premium/eagle-eye/eagle-eye-service'
import Errors from '@/shared/error/errors'

export default {
  ...sharedActions('eagleEye'),
  async doFetch({ commit }) {
    try {
      commit('FETCH_STARTED')

      const response = await EagleEyeService.search()

      commit('FETCH_SUCCESS', {
        list: response
      })
    } catch (error) {
      Errors.handle(error)
      commit('FETCH_ERROR')
    }
  }
}
