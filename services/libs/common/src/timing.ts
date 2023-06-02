export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })

export const addSeconds = (date: Date, seconds: number): Date => {
  const newDate = new Date(date)
  newDate.setSeconds(newDate.getSeconds() + seconds)
  return newDate
}
