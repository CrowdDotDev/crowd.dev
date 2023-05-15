export const timeout = async (delayMilliseconds: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, delayMilliseconds)
  })
