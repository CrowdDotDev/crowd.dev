import sharedGetters from '@/shared/store/getters'

export default {
  ...sharedGetters(),

  activeViewList: (state) => {
    const activeView = sharedGetters().activeView(state)

    return state.views[activeView.id].list
  }
}
