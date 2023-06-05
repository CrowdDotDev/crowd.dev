export const processPaginated = async <T>(
  dataLoader: (page: number) => Promise<T[]>,
  processor: (data: T[]) => Promise<boolean | void>,
): Promise<void> => {
  let page = 1
  let data = await dataLoader(page++)
  while (data.length > 0) {
    const result = await processor(data)
    if (result === true) {
      break
    }

    data = await dataLoader(page++)
  }
}
