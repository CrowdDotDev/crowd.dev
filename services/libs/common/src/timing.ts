export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })

export const addSeconds = (date: Date, seconds: number): Date => {
  const newDate = new Date(date)
  newDate.setSeconds(newDate.getSeconds() + seconds)
  return newDate
}

export const getSecondsTillEndOfMonth = (): number => {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const diffInSeconds = (endOfMonth.getTime() - now.getTime()) / 1000

  return diffInSeconds
}
