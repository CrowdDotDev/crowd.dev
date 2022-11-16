import moment from 'moment'

export default {
  openTasksCount: (state) => state.openTasksCount,
  closedTasksCount: (state) => state.closedTasksCount,
  archivedTasksCount: (state) => state.archivedTasksCount,
  myOpenTasks: (state) => state.myOpenTasks,
  myOpenTasksCount: (state) => state.myOpenTasksCount,
  myOpenOverdueTasks: (state, getters) => {
    return getters.myOpenTasks.filter((t) => {
      return (
        t.dueDate &&
        moment().startOf('day').isAfter(moment(t.dueDate))
      )
    })
  },
  myOpenDueSoonTasks: (state, getters) => {
    return getters.myOpenTasks.filter((t) => {
      return (
        t.dueDate &&
        moment()
          .add(1, 'day')
          .startOf('day')
          .isAfter(moment(t.dueDate))
      )
    })
  }
}
