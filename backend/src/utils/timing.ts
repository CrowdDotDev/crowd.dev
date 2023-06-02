import moment from 'moment'

export const getSecondsTillEndOfMonth = () => {
  const endTime = moment().endOf('month')
  const startTime = moment()

  return endTime.diff(startTime, 'seconds')
}
