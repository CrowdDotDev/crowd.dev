import { TaskService } from '@/modules/task/task-service'

export default {
  doInit({ dispatch }) {
    dispatch('getOpenTaskCount')
  },
  getOpenTaskCount({ commit }) {
    return TaskService.list(
      {
        status: { eq: 'in-progress' }
      },
      '',
      1,
      0
    ).then(({ count }) => {
      commit('SET_OPEN_TASK_COUNT', count)
      return Promise.resolve(count)
    })
  },
  getMyOpenTasks(
    { commit, rootGetters, state },
    loadMore = false
  ) {
    const currentUser = rootGetters['auth/currentUser']
    const limit = 20

    return TaskService.list(
      {
        assignedTo: { eq: currentUser.id },
        status: { eq: 'in-progress' }
      },
      '',
      limit,
      loadMore ? state.myOpenTasks.length : 0
    ).then((response) => {
      commit('SET_MY_TASKS', response)
      return Promise.resolve(response)
    })
  }
}
