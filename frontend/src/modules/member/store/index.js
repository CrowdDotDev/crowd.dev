import state from './state.js'
import actions from './actions.js'
import getters from './getters.js'
import mutations from './mutations.js'

export const INITIAL_PAGE_SIZE = 20

export default {
  namespaced: true,

  state,
  actions,
  getters,
  mutations
}
