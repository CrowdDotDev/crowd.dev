import state from './state.js'
import actions from './actions.js'
import getters from './getters.js'
import mutations from './mutations.js'
import invitation from './invitation'

export default {
  namespaced: true,

  state,
  actions,
  getters,
  mutations,
  modules: {
    invitation
  }
}
