export const singleOrDefault = <T>(array: T[], predicate: (T) => boolean): T | undefined => {
  const filtered = array.filter(predicate)
  if (filtered.length === 1) {
    return filtered[0]
  }

  if (filtered.length > 1) {
    throw new Error('Array contains more than one matching element!')
  }

  return undefined
}

export const single = <T>(array: T[], predicate: (T) => boolean): T => {
  const result = singleOrDefault(array, predicate)

  if (result === undefined) {
    throw new Error('Array contains no matching elements!')
  }

  return result
}
