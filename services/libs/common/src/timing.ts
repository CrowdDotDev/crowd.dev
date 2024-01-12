export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })

export const addSeconds = (date: Date, seconds: number): Date => {
  const newDate = new Date(date)
  newDate.setSeconds(newDate.getSeconds() + seconds)
  return newDate
}

export const EPOCH_DATE = new Date('1970-01-01T00:00:00+00:00')

export const getSecondsTillEndOfMonth = () => {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) // Set to last day of current month, at 23:59:59

  const diffInSeconds = (endOfMonth.getTime() - now.getTime()) / 1000
  return Math.round(diffInSeconds)
}
