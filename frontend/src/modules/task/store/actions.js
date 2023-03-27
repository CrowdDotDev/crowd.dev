import { TaskService } from '@/modules/task/task-service';

export default {
  doInit({ dispatch }) {
    dispatch('getMyOpenTasks');
  },
  getOpenTaskCount({ commit }) {
    return TaskService.list(
      {
        type: 'regular',
        status: { eq: 'in-progress' },
      },
      '',
      1,
      0,
    ).then(({ count }) => {
      commit('SET_OPEN_TASK_COUNT', count);
      return Promise.resolve(count);
    });
  },
  getMyOpenTasks(
    { commit, rootGetters, state },
    loadMore = false,
  ) {
    const currentUser = rootGetters['auth/currentUser'];
    const limit = 20;

    return TaskService.list(
      {
        type: 'regular',
        assignees: [currentUser.id],
        status: { eq: 'in-progress' },
      },
      '',
      limit,
      loadMore ? state.myOpenTasks.length : 0,
    ).then((response) => {
      commit('SET_MY_TASKS', response);
      return Promise.resolve(response);
    });
  },
  reloadTaskPage({ dispatch }) {
    dispatch('reloadOpenTasks');
    dispatch('reloadClosedTasks');
  },
  reloadOpenTasks({ dispatch }) {
    dispatch('getOpenTaskCount');
  },
  reloadClosedTasks() {},
  reloadArchivedTasks() {},
  reloadSuggestedTasks() {},
  addTask() {},
  editTask() {},
  openArchivedTasks() {},
};
