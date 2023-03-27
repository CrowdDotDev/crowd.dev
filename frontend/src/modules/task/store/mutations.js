export default {
  SET_OPEN_TASK_COUNT(state, payload) {
    state.openTasksCount = payload;
  },
  SET_CLOSED_TASK_COUNT(state, payload) {
    state.closedTasksCount = payload;
  },
  SET_ARCHIVED_TASK_COUNT(state, payload) {
    state.archivedTasksCount = payload;
  },
  SET_MY_TASKS(state, { rows, count, offset }) {
    state.myOpenTasks = offset > 0 ? [...state.myOpenTasks, ...rows] : rows;
    state.myOpenTasksCount = count;
  },
};
