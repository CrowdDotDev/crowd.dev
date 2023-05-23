export const isObject = (val: unknown): boolean => {
  return val !== null && typeof val === 'object'
}

export const isNullOrUndefined = (val: unknown): boolean => {
  return val === null || val === undefined
}

export const isObjectEmpty = (val: unknown): boolean => {
  if (!isObject(val)) {
    return false
  }

  for (const key of Object.keys(val)) {
    const value = val[key]
    if (value !== undefined) {
      return false
    }
  }

  return true
}

export const mergeIgnoreUndefined = <T extends Record<string, unknown>>(first: T, second: T): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = { ...first }

  for (const key of Object.keys(second)) {
    const value = second[key]
    if (value !== undefined) {
      result[key] = value
    }
  }

  return result
}
