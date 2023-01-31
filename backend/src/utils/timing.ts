import moment from 'moment'

export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })

export const getSecondsTillEndOfMonth = () => {
  const endTime = moment().endOf('month')
  const startTime = moment()

  return endTime.diff(startTime, 'seconds')
}
